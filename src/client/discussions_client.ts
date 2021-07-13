import { Attachments, DiscussionsClientSettings, Filter } from "./typings.ts";
import { RequestHandlerSettings } from "../rest/typings.ts";

import { Queue } from "../../deps.ts";
import { delay } from "../util/delay.ts";

import { handleRequest } from "../rest/request_handler.ts";

export class DiscussionsClient {
  /** Domain of wiki (e.g. "community" in "community.fandom.com") */
  domain: string;
  /** Wiki ID */
  wikiId: number;
  /** Whether or not the client has been initialized */
  initialized: boolean;
  /** Request queue delay */
  private queueDelay = 1000;
  /** Request queue */
  private queue: Queue;
  /** Client authentication data */
  private auth: { username?: string; password?: string; token?: string };
  constructor(settings: DiscussionsClientSettings) {
    this.domain = settings.domain;
    /** Set Default WikiID */
    this.wikiId = 0;

    // Check if any authentication was provided
    if (
      !settings.authentication.username && !settings.authentication.password &&
      !settings.authentication.token
    ) {
      throw new Error("No Authentication data provided");
    }

    this.initialized = false;

    this.auth = settings.authentication;
    this.queue = new Queue(true);
  }

  init() {
    return new Promise((resolve, reject) => {
      fetch(`https://${this.domain}.fandom.com/api/v1/Mercury/WikiVariables`)
        .then((response) => {
          if (!response.ok) {
            reject(
              `Error Initializing: ${response.status} ${response.statusText}`,
            );
          }

          response.json().then(({ data }) => {
            this.wikiId = data.id;
            this.initialized = true;
            resolve(this.wikiId);
          });
        });
    });
  }

  /** Login to discussions */
  login() {
    throw new Error("Login Currently Disabled, please use access token");
    // TODO: login api is currently broken for bots
    /*if (this.auth.token) {
      throw new Error("Authentication Error: token already exists");
    }
    if (!this.auth.username) {
      throw new Error("Authentication Error: username not provided");
    }
    if (!this.auth.password) {
      throw new Error("Authentication Error: password not provided");
    }*/
  }

  private async queueRequest(data: RequestHandlerSettings) {
    if (!this.initialized) {
      throw new Error(
        "Client Not Initialized - Use DiscussionsClient#init first",
      );
    }
    await delay(this.queueDelay);
    return handleRequest(data);
  }

  /* - [THREAD METHODS] - */

  /** Get a thread by id */
  getThread(id: string) {
    return new Promise((resolve, reject) => {
      this.queueRequest({
        domain: this.domain,
        controller: "DiscussionThread",
        method: "getThread",
        params: {
          threadId: id,
        },
        requestMethod: "GET",
        useAuthentication: true,
        authToken: this.auth.token,
      }).then(resolve, reject);
    });
  }

  /** Creates a new thread */
  createThread(options: {
    type: "TEXT" | "POLL";
    title: string;
    body?: string;
    articleIds?: string[];
    forumId?: string;
    attachments?: Attachments;
    poll?: {
      question: string;
      answers: {
        text: string;
        position: number;
        image?: {
          url: string;
          mediaType: string;
          width: number;
          height: number;
        };
      }[];
    };
  }) {
    return new Promise((resolve, reject) => {
      this.queueRequest({
        domain: this.domain,
        controller: "DiscussionThread",
        method: "create",
        params: {
          forumId: options.forumId ?? this.wikiId.toString(),
        },
        body: {
          articleIds: options.articleIds ?? [],
          attachments: {
            atMentions: [],
            contentImages: [],
            openGraphs: [],
            ...options.attachments,
          },
          poll: options.poll,
          body: options.body ?? "",
          forumId: options.forumId,
          funnel: options.type,
          source: "DESKTOP_WEB_FEPO",
          title: options.title,
          siteId: this.wikiId,
        },
        requestMethod: "POST",
        useAuthentication: true,
        authToken: this.auth.token,
      }).then(resolve, reject);
    });
  }

  /** Edits a thread */
  editThread(id: string, options: {
    type: "TEXT" | "POLL";
    title: string;
    body?: string;
    articleIds?: string[];
    forumId?: string;
    attachments?: Attachments;
    poll?: {
      question: string;
      answers: {
        text: string;
        position: number;
        image?: {
          url: string;
          mediaType: string;
          width: number;
          height: number;
        };
      }[];
    };
  }) {
    return new Promise((resolve, reject) => {
      this.queueRequest({
        domain: this.domain,
        controller: "DiscussionThread",
        method: "update",
        params: {
          threadId: id,
        },
        body: {
          articleIds: options.articleIds ?? [],
          attachments: {
            atMentions: [],
            contentImages: [],
            openGraphs: [],
            ...options.attachments,
          },
          poll: options.poll,
          body: options.body ?? "",
          forumId: options.forumId ?? this.wikiId.toString(),
          funnel: options.type,
          source: "DESKTOP_WEB_FEPO",
          title: options.title,
          siteId: this.wikiId,
        },
        requestMethod: "POST",
        useAuthentication: true,
        authToken: this.auth.token,
      }).then(resolve, reject);
    });
  }

  /** Deletes a thread by id */
  deleteThread(id: string) {
    return new Promise((resolve, reject) => {
      this.queueRequest({
        domain: this.domain,
        controller: "DiscussionThread",
        method: "delete",
        params: {
          threadId: id,
        },
        requestMethod: "POST",
        useAuthentication: true,
        authToken: this.auth.token,
      }).then(resolve, reject);
    });
  }

  /** Undelete a thread by id  */
  undeleteThread(id: string) {
    return new Promise((resolve, reject) => {
      this.queueRequest({
        domain: this.domain,
        controller: "DiscussionThread",
        method: "undelete",
        params: {
          threadId: id,
        },
        requestMethod: "POST",
        useAuthentication: true,
        authToken: this.auth.token,
      }).then(resolve, reject);
    });
  }

  /** Locks a thread by id */
  lockThread(id: string) {
    return new Promise((resolve, reject) => {
      this.queueRequest({
        domain: this.domain,
        controller: "DiscussionThread",
        method: "lock",
        params: {
          threadId: id,
        },
        requestMethod: "POST",
        useAuthentication: true,
        authToken: this.auth.token,
      }).then(resolve, reject);
    });
  }

  /** Unlock a thread by id. */
  unlockThread(id: string) {
    return new Promise((resolve, reject) => {
      this.queueRequest({
        domain: this.domain,
        controller: "DiscussionThread",
        method: "unlock",
        params: {
          threadId: id,
        },
        requestMethod: "POST",
        useAuthentication: true,
        authToken: this.auth.token,
      }).then(resolve, reject);
    });
  }

  changeThreadCategory(id: string, categoryId: string) {
    return new Promise((resolve, reject) => {
      this.queueRequest({
        domain: this.domain,
        controller: "DiscussionForum",
        method: "moveThreadsIntoForum",
        params: {
          forumId: categoryId,
        },
        body: {
          threadIds: [id],
        },
        requestMethod: "POST",
        useAuthentication: true,
        authToken: this.auth.token,
      }).then(resolve, reject);
    });
  }

  /* - [POST METHODS] - */

  /** Get a post by id */
  getPost(id: string) {
    return new Promise((resolve, reject) => {
      this.queueRequest({
        domain: this.domain,
        controller: "DiscussionPost",
        method: "getPost",
        params: {
          postId: id,
        },
        requestMethod: "GET",
        useAuthentication: true,
        authToken: this.auth.token,
      }).then(resolve, reject);
    });
  }

  createPost(options: {
    attachments?: Attachments;
    body: string;
    threadId: string;
  }) {
    return new Promise((resolve, reject) => {
      this.queueRequest({
        domain: this.domain,
        controller: "DiscussionPost",
        method: "create",
        params: {},
        body: {
          attachments: {
            atMentions: [],
            contentImages: [],
            openGraphs: [],
            ...options.attachments,
          },
          body: options.body ?? "",
          threadId: options.threadId,
          source: "DESKTOP_WEB_FEPO",
          siteId: this.wikiId,
        },
        requestMethod: "POST",
        useAuthentication: true,
        authToken: this.auth.token,
      }).then(resolve, reject);
    });
  }

  editPost(id: string, options: {
    attachments?: Attachments;
    body: string;
  }) {
    return new Promise((resolve, reject) => {
      this.queueRequest({
        domain: this.domain,
        controller: "DiscussionPost",
        method: "update",
        params: {
          postId: id,
        },
        body: {
          attachments: {
            atMentions: [],
            contentImages: [],
            openGraphs: [],
            ...options.attachments,
          },
          body: options.body ?? "",
          source: "DESKTOP_WEB_FEPO",
          siteId: this.wikiId,
        },
        requestMethod: "POST",
        useAuthentication: true,
        authToken: this.auth.token,
      }).then(resolve, reject);
    });
  }

  deletePost(id: string) {
    return new Promise((resolve, reject) => {
      this.queueRequest({
        domain: this.domain,
        controller: "DiscussionPost",
        method: "delete",
        params: {
          postId: id,
        },
        requestMethod: "POST",
        useAuthentication: true,
        authToken: this.auth.token,
      }).then(resolve, reject);
    });
  }

  undeletePost(id: string) {
    return new Promise((resolve, reject) => {
      this.queueRequest({
        domain: this.domain,
        controller: "DiscussionPost",
        method: "undelete",
        params: {
          postId: id,
        },
        requestMethod: "POST",
        useAuthentication: true,
        authToken: this.auth.token,
      }).then(resolve, reject);
    });
  }

  /* - [DiscussionModeration Methods] - */
  /** Report a thread/post by id */
  reportPost(id: string) {
    return new Promise((resolve, reject) => {
      this.queueRequest({
        domain: this.domain,
        controller: "DiscussionModeration",
        method: "reportPost",
        params: {
          postId: id,
        },
        requestMethod: "POST",
        useAuthentication: true,
        authToken: this.auth.token,
      }).then(resolve, reject);
    });
  }

  validatePostReport(id: string) {
    return new Promise((resolve, reject) => {
      this.queueRequest({
        domain: this.domain,
        controller: "DiscussionModeration",
        method: "validatePostReport",
        params: {
          postId: id,
        },
        requestMethod: "POST",
        useAuthentication: true,
        authToken: this.auth.token,
      }).then(resolve, reject);
    });
  }
  /* - [Methods to mass retrieve posts/threads] - */
  getLatestThreads(options?: { limit?: number; viewableOnly?: boolean }) {
    return new Promise((resolve, reject) => {
      this.queueRequest({
        domain: this.domain,
        controller: "DiscussionThread",
        method: "getThreads",
        params: {
          sortKey: "creation_date",
          limit: options?.limit?.toString() ?? "20",
          viewableOnly: options?.viewableOnly?.toString() ?? "true",
        },
        requestMethod: "GET",
      }).then(resolve, reject);
    });
  }

  getLatestPosts(options?: { limit?: number; viewableOnly?: boolean }) {
    return new Promise((resolve, reject) => {
      this.queueRequest({
        domain: this.domain,
        controller: "DiscussionPost",
        method: "getPosts",
        params: {
          sortKey: "creation_date",
          limit: options?.limit?.toString() ?? "20",
          viewableOnly: options?.viewableOnly?.toString() ?? "true",
        },
        requestMethod: "GET",
      }).then(resolve, reject);
    });
  }
}
