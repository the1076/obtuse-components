var componentsDirectory = '/components/';
var manifestPath = '/components/manifest.json';
var useShadowRoot = true;
const components = {};
const globalStyles = [];

export class ObtuseComponentDefinition
{
    constructor()
    {
    }

    async init()
    {
        if(this.template == null)
        {
            let htmlResponse = await request(this.htmlPath);
            let html = await htmlResponse.text();
            let htmlTemplate = new DOMParser().parseFromString(html, 'text/html').querySelector('template');
            this.template = htmlTemplate;
        }
        else if(Object.prototype.toString.call(this.template))
        {
            this.template = new DOMParser().parseFromString(this.template, 'text/html').querySelector('template');
        }

        if(this.style == null)
        {
            let styleResponse = await request(this.stylePath);
            let css = await styleResponse.text();
            this.style = css;
        }

        if(this.module == null)
        {
            let module = await import(this.scriptPath);
            this.module = module.default;
        }
    }

    static new(componentClassName, tagName, basePath, htmlPath, stylePath, scriptPath)
    {
        if(componentClassName == null || Object.prototype.toString.call(componentClassName) !== '[object String]' || componentClassName.trim() == '')
        {
            throw new Error('Cannot create a component definition without a componentClassName.');
        }
        let definition = new ObtuseComponentDefinition();

        definition.baseName = toKebabCase(componentClassName);
        definition.basePath = basePath || ObtuseComponents.componentsDirectory + definition.baseName + '/';
        let sharedName = definition.basePath + definition.baseName;

        definition.componenentClassName = componentClassName;
        definition.tagName = tagName || definition.baseName;
        definition.htmlPath = htmlPath || sharedName + '.html';
        definition.stylePath = stylePath || sharedName + '.css';
        definition.scriptPath = scriptPath || sharedName + '.js';

        definition.template = null;
        definition.style = null;
        definition.module = null;

        return definition;
    }

    static fromResource(resource)
    {
        if(resource.componentClassName == null || Object.prototype.toString.call(resource.componentClassName) !== '[object String]' || resource.componentClassName.trim() == '')
        {
            throw new Error('Cannot create a component from a manifest entry without a componentClassName.');
        }

        let definition = new ObtuseComponentDefinition();

        Object.assign(definition, resource);

        definition.baseName = definition.baseName || toKebabCase(resource.componentClassName);
        definition.basePath = definition.basePath || ObtuseComponents.componentsDirectory + definition.baseName + '/';
        let sharedName = definition.basePath + definition.baseName;

        definition.componenentClassName = resource.componentClassName;
        definition.tagName = definition.tagName || definition.baseName;
        definition.htmlPath = definition.htmlPath || sharedName + '.html';
        definition.stylePath = definition.stylePath || sharedName + '.css';
        definition.scriptPath = definition.scriptPath || sharedName + '.js';

        definition.template = definition.template || null;
        definition.style = definition.style || null;
        definition.module = definition.module || null;

        return definition;
    }
}

export class ObtuseComponent extends HTMLElement
{
    static get observedAttributes() { return []; }

    constructor() { super(); }

    async _init() { }

    async connectedCallback()
    {
        let contentTarget = this;
        if(ObtuseComponents.useShadowRoot)
        {
            contentTarget = this.attachShadow({ mode: 'open' });
        }

        let resource = ObtuseComponents.getComponentDefinition(this.constructor.name);
        contentTarget.appendChild(resource.template.content.cloneNode(true));
        
        ObtuseComponents.setStyle(this);

        await this._init();
        this.__isConnected = true;
        this.dispatchComponentEvent(this, 'onconnect');
    }
    disconnectedCallback()
    {
        this.__isConnected = false;
        this.dispatchComponentEvent(this, 'ondisconnect');
    }
    adoptedCallback() { this.dispatchComponentEvent(this, 'onadopted'); }
    attributeChangedCallback(name, oldValue, newValue)
    {
        if(!this.__isConnected)
        {
            return;
        }

        console.log({ name: name, oldValue: oldValue, newValue: newValue });

        this.dispatchComponentEvent(this, 'onattributechanged', { name: name, oldValue: oldValue, newValue: newValue });
    }

    dispatchComponentEvent($target, eventName, data)
    {
        if($target == this)
        {
            let customEvent = (data) ? new CustomEvent(eventName, { detail: data }) : new CustomEvent(eventName); this.dispatchEvent(customEvent);
        }

        let handlerAttributeName = 'on' + eventName;
        let onEvent = $target.getAttribute(handlerAttributeName);
        if(onEvent)
        {
            try
            {
                onEvent = onEvent.split('.').reduce((o,i)=> { return o[i]; }, window);
                onEvent({target: $target, detail: data });
            }
            catch(exception)
            {
                console.error("Unable to execute callback: " + exception.message);
            }
        }
    }
}

export class ObtuseComponents
{
    static get componentsDirectory()
    {
        return componentsDirectory;
    }
    static set componentsDirectory(value)
    {
        componentsDirectory = value;
    }

    static get manifestPath()
    {
        return manifestPath;
    }
    static set manifestPath(value)
    {
        manifestPath = value;
    }

    static get useShadowRoot()
    {
        return useShadowRoot;
    }
    static set useShadowRoot(value)
    {
        useShadowRoot = value;
    }

    static async register(components)
    {
        if(components == null)
        {
            components = await getManifest();
        }

        if(!Array.isArray(components))
        {
            components = [components];
        }
        
        let promises = [];
        for(let i = 0; i < components.length; i++)
        {
            promises.push(register(components[i]));
        }

        await Promise.allSettled(promises);
    }

    static getComponentDefinition(componenentClassName)
    {
        return components[componenentClassName];
    }

    static setStyle($component)
    {
        let name = $component.constructor.name;

        if(globalStyles.indexOf(name) > -1 && !useShadowRoot)
        {
            return;
        }
        
        let style = document.createElement('style');
        style.classList.add('component');
        let minifiedStyle = components[name].style.replace(/(\r\n?|(\s\s)+)/g,'');
        style.innerText = minifiedStyle;

        if(useShadowRoot)
        {
            $component.shadowRoot.prepend(style);
        }
        else
        {
            document.head.appendChild(style);
            globalStyles.push(name);
        }
    }
}

function register(entry)
{
    return new Promise(async (resolve, reject) =>
    {
        let definition = await getComponentDefinition(entry);
        if(definition == null)
        {
            reject();
            return;
        }
        
        components[definition.componenentClassName] = definition;
    
        customElements.define(definition.tagName, definition.module);
        resolve(definition);
    });
}

function toKebabCase(value)
{
    value = value.replace(/\\.+$/, "") //trim trailing periods
            .replace(/[^\w\d\s]/g, '') //replace symbols
            .replace(/\s+/g, '-') //switch spaces for dashes
            .replace(/[A-Z]+/g, function ($1, offset, string) //replace capitals with dash then character
            {
                if (string.indexOf($1) == 0)
                {
                    return $1;
                }

                if (string.substring(string.indexOf($1) - 1, string.indexOf($1)) == '-')
                {
                    return $1;
                }

                return '-' + $1;
            })
            .toLowerCase(); //make the whole thing lowercase
    
    return value;
}

function request(route, method, body, headers)
{
    if(route == null || Object.prototype.toString.call(route) != "[object String]" || route.trim() == "")
    {
        throw new Error('Cannot request a resource without a route.');
    }

    method = method || (body) ? 'POST' : 'GET';
    headers = headers;

    return fetch(route, { method: method, body: body, headers: headers, referrer: 'no-referrer' })
    .then(function (response)
    {
        if (response.ok)
        {
            return response;
        }
        else
        {
            return Promise.reject(response);
        }
    })
    .catch(function (error)
    {
        console.error('There was an error requesting the resource.', error);
    });
}

async function getManifest()
{
    let response = await request(manifestPath);
    let components = await response.json();
    return components;
}

async function getComponentDefinition(resource)
{
    try
    {
        let definition;
        if(Object.prototype.toString.call(resource) == "[object String]")
        {
            definition = ObtuseComponentDefinition.new(resource);
        }
        else
        {
            definition = ObtuseComponentDefinition.fromResource(resource);
        }
        if(definition == null)
        {
            throw new Error(new Error("Unable to load component from manifest entry: " + JSON.stringify(resource)))
        }
    
        await definition.init();
    
        return definition;
    }
    catch(exception)
    {
        console.error(exception);
    }
}