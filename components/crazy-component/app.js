import { ObtuseComponent } from "../obtuse-components.js";

export default class RandomName extends ObtuseComponent
{
    constructor()
    {
        super();
    }

    async _init()
    {
        console.log('The crazy component\'s script still ran.');
    }
}