# obtuse-components
Vanilla JS \[ES6\] web components that use a similar file structure as Angular  
See a demo of this library in action on [GitHub Pages](https://the1076.github.io/obtuse-components/)!

# Disclaimer
This library is an actively developed helper library that is tailored to specific projects. Changes to the codebase may come without warning or documentation. Please fork the project if you would like to use the library in your own work.  
I make no guarantees about the performance of this library in a production environment.

# Statistics
| | |
|---|---|
|Filesize (no server-side zipping) | 10kb |
|minified filesize (no server-side zipping) | 5.04kb |
|LOC (lines of code)|~350 (verbose)|

# Deployment
The only file that is needed for this library is the `obtuse-components.js` file or the `obtuse-components.min.js` file for the minified version.

The file uses ES6 exports so it can be imported like so:
```
import { ObtuseComponents, ObtuseComponent, ObtuseComponentDefinition } from '/path/to/obtuse-components.js';
```

It is not recommended to load the file from your html, as the library uses other ES6 features, so there should be no reason that loading from HTML would be required. If you have a niche case, though, it should be possible if you remove all of the `export` statements from the `obtuse-components.js` file.

# Usage
This library, like Angular, is convention-based. While most things are configurable, the defaults rely heavily on following defined practices.

By default, the library will expect that there is a folder in the `:root` path named `components` and that path (`:root/components/`) will contain a component manifest file named `manifest.json`.

If you would like to change where the manifest is located, simply use the `manifestPath` static property of the `ObtuseComponents` object to update the manifest path.
```js
ObtuseComponents.manifestPath = './my-custom/path/to-components/manifest.json';
// OR
ObtuseComponants.manifestPath = '/component-list.json';
```

Likewise, if you would like to change the `components` path, update the `componentsDirectory` static property of the `ObtuseComponents` object.
```js
ObtuseComponents.componentsDirectory = './my-custom/path/to-components/manifest.json';
```

Once your paths are set up, the only thing you need to do to load your components is to use the static `register()` method on the `ObtuseComponents` object.  
If you call the `register()` method with no parameters, it will load the components from your component manifest. However, you can also call the method while passing in an array of component definitions, while will make the library ignore the manifest and only load those components that are defined in the parameter array.
```js
ObtuseComponents.register(); // this loads component definitions from the manifest

let components = 
[
    "TextInput",
    "NumberInput",
    { 
        "componentClassName": "TextareaInput",
        "basePath": "/src/components/sub-components/textarea-input/"
    },
    {
        "componentClassName": "RandomName",
        "tagName": "not-advised",
        "htmlPath": "/src/components/crazy-component/template.html",
        "stylePath": "/src/components/crazy-component/style.css",
        "scriptPath": "/src/components/crazy-component/app.js"
    }
]
ObtuseComponents.register(components); // this loads the components listed in the "components" array.
```

## Component Definitions
Components need to be defined with five properties:
- Class name
- Tag name
- Template/HTML path
- Style/CSS path
- Script/Javascript path

With those pieces of information, a component can be loaded from external files, registered with a page, and initialized.

If you would like to explicitly define those properties, you can do with the following structure:
```js
{
    componentClassName: "", // string; name of the component's class
    tagName: "", // string; what you want to use in the DOM
    htmlPath: "", // string; path to the file where your component's template data is
    stylePath: "", // string; path to the file where your component's style data is.
    scriptPath: "", // string; path to the file where your component's object class is.
}
```

In addition to explicitly defining where the paths for your template and styles are, you can also use the `template` and `style` properties to directly define those values.
```js
{
    componentClassName: "",
    template: "", //string; a string of html that will be used as your component's template
    style: "", //string; a string of css that will be used as your component's style.
}
```

Note that these properties will override any pathing that would lookup template or style definitions.

## Simplified Definitions
Rather than expecting well-formed definitions for each component, the `obtuse-components` library will allow for simplified definitions, as well. By using convention and structure, a component can be loaded from a single text string.

In example, consider this component
```js
export default class MyComponent extends ObtuseComponent
{
    ...
}
```

If that component exists in a structure like this:
- my-component
  - my-component.html
  - my-component.css
  - my-compoennt.js

That would allow the library to load the component with only the class name as a definition.
```js
let components = ["MyComponent"];
ObtuseComponents.register(components);
```

The tag name will be a kebab-case version of the class name (so `<my-component></my-component>`) and the file names and path, being kebab-case, will also be able to be found and loaded because of the naming structure. So, by following that convention, loading components can be done with only the class name.

### useShadowRoot
By default, the library will attach all templates to the shadow root of your custom element. If you would like the content of your custom element to be in the light DOM, just set the static `useShadowRoot` property on the `ObtuseComponents` object to `false`.

When appending to the light DOM, all component styles will be added into the loading page's head tag. This is gated to ensure it only happens once.

### attributeChangedCallback handler
When an attribute is changed on a custom component's DOM element, an `attributeChanged` event is fired which is handled by an `attributeChangedCallback` on the default `ObtuseComponent`.  
If you would like to intercept this call, you will need two things on your custom component
- A method named `attributeChangedCallback`. As this is standard functionality for web components, this method MUST be named `attributeChangedCallback`.
- A static getter property named `observedAttributes` that holds an array of attribute names. The callback will only fire when attributes are changed that have the same name as a string in the `observedAttributes` array.

In example:
```js
export default class MyComponent
{
    static get observedAttributes()
    {
        return [
            'min',
            'max',
            'placeholder'
        ];
    }
    constructor() { super(); }

    attributeChangedCallback(name, oldValue, newValue)
    {
        if(name === 'min')
        {
            // do something
        }
        else if(name === 'type')
        {
            // this will never run because 'type' is
            // not in the observed attributes, so it
            // will never fire the attributeChangedCallback method.
        }
    }
}
```

# Notes
- Default component directory is `:root/components/`.
- By default, the library will expect components in the following format:
  - component-name \[folder\]
    - component-name.html \[html\]
    - component-name.css \[css\]
    - component-name.js \[js\]
- By default, the library will expect either strings or `ObtuseComponentDefinition` objects in the manifest.
- By default, the library will log any attribute changes to the console. It is expected that if you want to trigger functionality when attributes are changed, you will need to implement your own `attributeChangedCallback` method on your components.
- This library curries all of your web components at the time of registration. The external files are only loaded once, but they are ALL loaded, upfront. A newer version of this library will probably be made to defer that loading to be 'just-in-time', but it currently just loads everything at the beginning.

# FAQ
- Isn't it easier to forgo the file-structure formatting, and just use vanilla Web Components without the Angular-inspired constraints?
  - Yes! At least, in my experience! For most things, I can't recommend using this library ("obtuse" isn't ONLY a reference to Angular...). In some situations, though, I have found that this type of file structuring makes for a very team-friendly approach to component development. It's kind of just immediately obvious where the separation of concerns is, and how one would go about continuing development on a component that they may have never even heard of before. So that's worth... well, it's worth what it's worth.  
  As with anything, this library has a trade-off. We sacrifice a tiny bit of speed and data overhead (size of the library) for structural clarity and development modularity.
- Do you have an example of a project where this library might help?
  - I've used this library in creating live style-guides. Because each component in a style guide should really modularize its own styling and functional performance, I've found this method really nice for that purpose. Note that it's an internal tool I use it for, rather than a public-facing one.  
  In an ideal world, this library could be used for rapid, sterile development and then replaced with bespoke components, when the project matures. But, honestly, the library can be served much cheaper than most component libraries out there, so it's not like it's the end of the world if you ship an app with these components. Not everything can be maintained to the blistering edge of performance.