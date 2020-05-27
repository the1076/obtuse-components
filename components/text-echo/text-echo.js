import { ObtuseComponent } from '../obtuse-components.js';
export default class TextEcho extends ObtuseComponent
{
    static get observedAttributes() { return ['to-echo']; }
    _init()
    {
        this.$content = this.shadowRoot.querySelector('p');
        this.$content.innerHTML = this.getAttribute('to-echo');
    }
    attributeChangedCallback(name, oldValue, newValue)
    {
        if(!this.__isConnected) { return; }
        if(name == 'to-echo')
        {
            this.$content.innerHTML = newValue;
        }
    }
}