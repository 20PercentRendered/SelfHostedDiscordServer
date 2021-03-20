import { SafeUser } from "./User"


export class Guild {
    public id: string
    public name: string
    public icon: string
    public banner: string
    public owner_id: string
    public application_id: string
    public region: string = "internal"
    public afk_channel_id: string
    public afk_timeout: number
    public system_channel_id: string
    public widget_enabled: boolean
    public widget_channel_id: string
    public verification_level: number
    public description: string
    public splash: string
    public discovery_splash: string
    public features: Array<string>
    public channels: Array<Channel>
    public roles: Array<Role>
    public presences: Array<any>
    public members: Array<GuildMember>
    public voice_states: Array<any>
    public emojis: Array<Emoji>
    public default_message_notifications: number
    public mfa_level: number
    public explicit_content_filter: number
    public max_presences: number
    public max_members: number
    public max_video_channel_users: number
    public vanity_url_code: string
    public premium_tier: number
    public premium_subscription_count: number
    public system_channel_flags: number
    public preferred_locale: string
    public rules_channel_id: string
    public public_updates_channel_id: string
    public approximate_member_count = 543 
    public approximate_presence_count = 312
    constructor (name) {
        this.name = name;
        this.members = new Array<GuildMember>();
        this.channels = new Array<Channel>();
        this.roles = new Array<Role>();
        this.presences = new Array<any>();
        this.members = new Array<GuildMember>();
        this.voice_states = new Array<any>();
        this.emojis = new Array<Emoji>();
        this.max_members = 50000;
        this.max_video_channel_users = 50000;
        this.max_presences = 50000;
        this.afk_timeout = 1200;
        this.premium_subscription_count = 0;
        this.premium_tier = 3;
        this.system_channel_flags = 0;
        this.preferred_locale = "en-US";
        this.rules_channel_id = null;
        this.public_updates_channel_id = null;
    }
}
export class JoinedGuild extends Guild {
    public joined_at: Date
    constructor (name) {
        super(name);
        this.joined_at = new Date();
    }
}
export class GuildMember {
    user: SafeUser;
    nick?: string;
    roles: Array<string>;
    joined_at: Date;
    premium_since?: Date;
    deaf: boolean;
    mute: boolean;
    pending?: boolean;
    permissions?: string;
    constructor (user: SafeUser) {
        this.user = user;
        this.joined_at = new Date();
        this.roles = new Array<string>();
        this.deaf = false;
        this.mute = false;
        this.pending = false;
    }
}
export class Channel {

}
export class Role {
    public id: string
    public name: string
    public permissions: string
    public position: number
    public color: string
    public hoist: boolean
    public managed: boolean
    public mentionable: boolean
}
export class Emoji {

}
export class PermissionOverride {

}
export class GuildMessage {
    id: string;
    type: number;
    content: string;
    channel_id: string;
    author: SafeUser;
    attachments: Array<any>;
    embeds: Array<any>;
    mentions: Array<any>;
    mention_roles: Array<any>;
    pinned: boolean;
    mention_everyone: boolean;
    tts: boolean;
    timestamp: Date;
    edited_timestamp?: any;
    flags: number;
    nonce: string;
    referenced_message?: any;
}
export class EveryoneRole extends Role {
    constructor (id) {
        super();
        this.id = id;
        this.color = "0";
        this.permissions = "2251804225";
        this.position = 0;
        this.hoist = false;
        this.managed = false;
        this.mentionable = false;
        this.name = "@everyone"
    }
}
export class UnavailableGuild {
    public id: string;
    public unavailable: boolean = true;
    constructor (id) {
        this.id = id;
    }
}
export class GuildRegion {
    public id: string;
    public name: string;
    public custom: boolean = false;
    constructor (id, name) {
        this.id = id;
        this.name = name;
    }
}