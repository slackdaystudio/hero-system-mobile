import FollowerAndBase from './FollowerAndBase';

const FOLLOWER = 'FOLLOWER';

const VEHICLE_BASE = 'VEHICLE_BASE';

class PerkDecorator {
    decorate(decorated) {
        switch (decorated.trait.xmlid.toUpperCase()) {
            case FOLLOWER:
            case VEHICLE_BASE:
                decorated = new FollowerAndBase(decorated);
            default:
                // do nothing
        }

        return decorated;
    }
}

export let perkDecorator = new PerkDecorator();