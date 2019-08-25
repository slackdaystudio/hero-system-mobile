import FollowerAndBase from './FollowerAndBase';
import Contact from './Contact';
import ResourcePoints from './ResourcePoints';

const FOLLOWER = 'FOLLOWER';

const VEHICLE_BASE = 'VEHICLE_BASE';

const CONTACT = 'CONTACT';

const RESOURCE_POOL = 'RESOURCE_POOL';

class PerkDecorator {
    decorate(decorated) {
        switch (decorated.trait.xmlid.toUpperCase()) {
            case FOLLOWER:
            case VEHICLE_BASE:
                decorated = new FollowerAndBase(decorated);
                break;
            case CONTACT:
                decorated = new Contact(decorated);
                break;
            case RESOURCE_POOL:
                decorated = new ResourcePoints(decorated);
                break;
            default:
                // do nothing
        }

        return decorated;
    }
}

export let perkDecorator = new PerkDecorator();