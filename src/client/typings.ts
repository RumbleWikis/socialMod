/** Discussions Client Settings Interface */
export interface DiscussionsClientSettings {
  /** Domain for wiki (e.g. "community" in "community.fandom.com")*/
  domain: string;
  /** Bot account authentication data */
  authentication: {
    /** Username for bot account*/
    username?: string;
    /** Password for bot account */
    password?: string;
    /** "access_token" cookie (alternative to username + password) */
    token?: string;
  };
}

/** Discussions Automod  Settings Interface */
export interface DiscussionsAutomodSettings {
  /** Domain for wiki (e.g. "community" in "community.fandom.com")*/
  domain: string;
  /** Bot account authentication data */
  authentication: {
    /** Username for bot account*/
    username?: string;
    /** Password for bot account */
    password?: string;
    /** "access_token" cookie (alternative to username + password) */
    token?: string;
  };
  /** Array of Filter objects */
  filters: Filter[];
  /** Default filter discord webhook url */
  defaultFilterDiscordWebhookUrl?: string;
  /** New posts filtering check interval in milliseconds */
  filterInterval: number;
}

/** Object with filter data */
export interface Filter {
  /** Filter name */
  name: string;
  /** What to do if filter is triggered */
  action: "log" | "delete" | "recategorize" | "reply";
  /** Category to move to (if action = "recategorize") */
  targetCategoryId?: string;
  /** Content to reply with (if action = "reply") */
  replyMessage?: string;
  /** Array of regexp filters */
  rules: RegExp[];
  /** Optional discord webhook to send actions to */
  discordWebhookUrl?: string;
  /** Whether or not having discussions rights bypasses the filter */
  rightsBypass?: boolean;
  /** Whether or not the filter checks the title of threads (true by default) */
  checkTitle?: boolean;
}

export interface Attachments {
  atMentions?: { id: string }[];
  contentImages?: { url: string; height: number; width: number }[];
  openGraphs?: {
    description: string;
    imageHeight: number | null;
    imageWidth: number | null;
    imageUrl: string | null;
    siteName: string;
    title: string;
    type: string;
    url: string;
    videoUrl: string | null;
    videoHeight: number | null;
    videoWidth: number | null;
  }[];
}
