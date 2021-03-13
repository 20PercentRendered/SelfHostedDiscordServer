import bigInt from "big-integer"

export class Permission {
    private bigPermission: bigInt.BigInteger;
    static CREATE_INSTANT_INVITE = bigInt(1).shiftLeft(0);
    static KICK_MEMBERS = bigInt(1).shiftLeft(1);
    static BAN_MEMBERS = bigInt(1).shiftLeft(2);
    static ADMINISTRATOR = bigInt(1).shiftLeft(3);
    static MANAGE_CHANNELS = bigInt(1).shiftLeft(4);
    static MANAGE_GUILD = bigInt(1).shiftLeft(5);
    static ADD_REACTIONS = bigInt(1).shiftLeft(6);
    static VIEW_AUDIT_LOG = bigInt(1).shiftLeft(7);
    static PRIORITY_SPEAKER = bigInt(1).shiftLeft(8);
    static STREAM = bigInt(1).shiftLeft(9);
    static VIEW_CHANNEL = bigInt(1).shiftLeft(10);
    static SEND_MESSAGES = bigInt(1).shiftLeft(11);
    static SEND_TTS_MESSAGES = bigInt(1).shiftLeft(12);
    static MANAGE_MESSAGES = bigInt(1).shiftLeft(13);
    static EMBED_LINKS = bigInt(1).shiftLeft(14);
    static ATTACH_FILES = bigInt(1).shiftLeft(15);
    static READ_MESSAGE_HISTORY = bigInt(1).shiftLeft(16);
    static MENTION_EVERYONE = bigInt(1).shiftLeft(17);
    static USE_EXTERNAL_EMOJIS = bigInt(1).shiftLeft(18);
    static VIEW_GUILD_INSIGHTS = bigInt(1).shiftLeft(19);
    static CONNECT = bigInt(1).shiftLeft(20);
    static SPEAK = bigInt(1).shiftLeft(21);
    static MUTE_MEMBERS = bigInt(1).shiftLeft(22);
    static DEAFEN_MEMBERS = bigInt(1).shiftLeft(23);
    static MOVE_MEMBERS = bigInt(1).shiftLeft(24);
    static USE_VAD = bigInt(1).shiftLeft(25);
    static CHANGE_NICKNAME = bigInt(1).shiftLeft(26);
    static MANAGE_NICKNAMES = bigInt(1).shiftLeft(27);
    static MANAGE_ROLES = bigInt(1).shiftLeft(28);
    static MANAGE_WEBHOOKS = bigInt(1).shiftLeft(29);
    static MANAGE_EMOJIS = bigInt(1).shiftLeft(30);
    private constructor (permissionBits: bigInt.BigInteger) {
        this.bigPermission = permissionBits;
    }
    static FromPermissionBits(permissionBits: string): Permission {
        return new Permission(bigInt(permissionBits));
    }
    HasPermission(permission: bigInt.BigInteger): boolean  {
        return this.toBigInt().and(permission).equals(permission);
    }
    HasPermissionByName(permission: string): boolean {
        return this.HasPermission(Permission[permission]);
    }
    SetPermission(permission: bigInt.BigInteger): Permission {
        this.bigPermission = this.bigPermission.or(permission);
        return this;
    }
    SetPermissionByName(permission: string): Permission {
        return this.SetPermission(Permission[permission]);
    }
    toString(): string {
        return this.toBigInt().toString()
    }
    toBigInt(): bigInt.BigInteger {
        return this.bigPermission;
    }
}