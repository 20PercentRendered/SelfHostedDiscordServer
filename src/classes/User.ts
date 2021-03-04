import SSLModule from "@main/modules/ssl/main";
import { ServerData } from "@main/serverdata";
import { Guild, UnavailableGuild } from "./Guild";
const userCheckRegex = /^[a-zA-Z0-9#]+$/;
export class User {
    public id: string
    public login: string
    public password: string
    public is2FA: boolean;
    public tokenFirstPart: string;
    public safe: SafeUser;
    public unsafe: GatewayUser; //todo: better name than unsafe....
    public guilds: Array<UnavailableGuild>;
    public settings: UserSettings;
	public tutorial: Tutorial;
    constructor (id, login, password, username, discriminator, dateOfBirth) {
        this.id = id;
        this.login = login;
        this.password = password;
        this.is2FA = false; // TODO: support 2fa
        this.safe = new SafeUser(this.id, username, discriminator, 0, "", false)
        this.unsafe = new GatewayUser(this.id, username, discriminator, 0, "", false)
        this.unsafe.email = this.login;
        this.unsafe.flags = this.safe.public_flags;
        this.unsafe.mfa_enabled = this.is2FA;
        this.unsafe.nsfw_allowed = true;
        this.unsafe.phone = ""
        this.guilds = new Array<UnavailableGuild>();
        this.tokenFirstPart = ServerData.getInstance().modules.getModule<SSLModule>("ssl").getBase64User(this.id)
        this.settings = new UserSettings();
        this.tutorial = new Tutorial();
        this.settings.date_of_birth = dateOfBirth
    }
    changePassword(newPassword: string) {
        this.password = newPassword
    }
    changeUsername(newUsername: string) {
        this.safe.username = newUsername;
        this.unsafe.username = newUsername;
    }
}
export class Tutorial {
    indicators_suppressed: boolean = false;
    indicators_confirmed: Array<string> = new Array<string>();
}
export class SafeUser {
    public id: string
    public username: string
    public avatar?: string
    public discriminator: string
    public public_flags: number
    public premium_type: NitroType
    public desktop?: boolean
    public premium?: boolean
    public mobile?: boolean
    public verified?: boolean
    public bot: boolean
    constructor(id, username, discriminator, public_flags = 0, avatar = "", bot = false) {
        this.id = id
        this.username = username
        this.avatar = avatar
        this.discriminator = discriminator
        this.public_flags = public_flags
        this.bot = bot;
    }
}
export class GatewayUser extends SafeUser {
    public mfa_enabled: boolean
    public email: string
    public flags: number
    public nsfw_allowed: boolean
    public phone: string
}
export enum NitroType {
    none = 0,
    classic = 1,
    normal = 2
}
export class Relationship {
    public id: string
    public type: RelationshipType
    public nickname: string
    public user: SafeUser
    constructor(user: SafeUser, type: number = RelationshipType.friend) {
        this.id = user.id
        this.type = type;
        this.nickname = user.username
        this.user = user;
    }
}
export enum RelationshipType {
    friend = 1
}
export class UserSettings {
    locale: string = "en-US";
    show_current_game: boolean = true;
    restricted_guilds: Array<Guild>;
    default_guilds_restricted: boolean = false;
    inline_attachment_media: boolean = true;
    inline_embed_media: boolean = true;
    gif_auto_play: boolean = true;
    render_embeds: boolean = true;
    render_reactions: boolean = true;
    animate_emoji: boolean = true;
    enable_tts_command: boolean = true;
    message_display_compact: boolean = false;
    convert_emoticons: boolean = false;
    explicit_content_filter: number = 0;
    disable_games_tab: boolean = true;
    theme: string = "dark";
    developer_mode: boolean;
    guild_positions: Array<any>; //TODO: any type
    detect_platform_accounts: boolean = false;
    status: string = "online";
    afk_timeout: number = 3000; // 5 minutes
    timezone_offset: number = null;
    stream_notifications_enabled: boolean = true;
    allow_accessibility_detection: boolean = false;
    contact_sync_enabled: boolean = false;
    native_phone_integration_enabled: boolean = false;
    animate_stickers: number = 1;
    friend_source_flags: {all: boolean};
    guild_folders: Array<any>; //TODO: any type
    custom_status?: any;
    date_of_birth: string;
}