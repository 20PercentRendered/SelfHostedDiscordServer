import { GuildMember } from "./Guild";

export class VoiceState {
    public guild_id: string;
    public channel_id?: string;
    public user_id: string;
    public member: GuildMember;
    public session_id: string;
    public deaf: boolean = false;
    public mute: boolean = false;
    public self_deaf: boolean = false;
    public self_mute: boolean = false;
    public self_stream?: boolean = false;
    public self_video: boolean = false;
    public suppress: boolean = false;
    constructor (user: GuildMember, 
                guild_id: string,
                channel_id: string = null) 
    {
        this.member = user;
        this.user_id = user.user.id;
        this.guild_id = guild_id;
        this.channel_id = channel_id;
    }
}
export class VoiceServerUpdatePayload {
    public token: string;
    public guild_id: string;
    public endpoint: string;
    constructor (token, endpoint, guild_id = null) {
        this.token = token;
        this.endpoint = endpoint;
        this.guild_id = guild_id;
    }
}