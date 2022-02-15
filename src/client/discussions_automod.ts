import { DiscussionsClient } from "./discussions_client.ts";
import { DiscussionsAutomodSettings, Filter } from "./typings.ts";
import { ActionEmbedColours } from "../util/constants.ts";

export class DiscussionsAutomod extends DiscussionsClient {
  filters: Filter[];
  private lastPostId: bigint;
  private filterInterval: number;
  private defaultFilterDiscordWebhookUrl?: string;
  constructor(settings: DiscussionsAutomodSettings) {
    super(settings);

    this.filters = settings.filters;
    this.filterInterval = settings.filterInterval;
    this.defaultFilterDiscordWebhookUrl =
      settings.defaultFilterDiscordWebhookUrl;
    this.lastPostId = 0n;
  }

  runFilters() {
    setInterval(() => {
      //deno-lint-ignore no-explicit-any
      this.getLatestPosts().then((postsData: any) => {
        const posts = postsData["_embedded"]["doc:posts"];

        if (!posts) return;

        //deno-lint-ignore no-explicit-any
        posts.forEach((post: any) => {
          if (BigInt(post.id) > this.lastPostId && !post.isDeleted) {
            this.filters.forEach((filter) => {
              if (filter.rightsBypass && post.createdBy.badgePermission) return;

              if (
                filter.originCategoryIds &&
                !filter.originCategoryIds.includes(post.forumId)
              ) {
                return;
              }

              filter.checkTitle = filter.checkTitle ?? true;
              let filteringRule: RegExp;

              filter.rules.forEach((rule) => {
                if (filteringRule) return;

                if (!post.isReply && filter.checkTitle) {
                  if (rule.test(post.title)) {
                    filteringRule = rule;
                  }
                }

                if (!filteringRule) {
                  if (rule.test(post.rawContent)) {
                    filteringRule = rule;
                  }
                }
              });

              if (filteringRule!) {
                /** Whether or not to log the action or not (set to false if unable to perform action) */
                let logAction = true;
                //Perform action
                switch (filter.action) {
                  case "log":
                    // Nothing to do here, all hits get logged in embed stage
                    break;
                  case "delete":
                    if (post.isReply) {
                      this.deletePost(post.id).catch((reason) => {
                        throw new Error(reason);
                      });
                    } else {
                      this.deleteThread(post.threadId).catch((reason) => {
                        throw new Error(reason);
                      });
                    }
                    break;
                  case "recategorize":
                    if (!filter.targetCategoryId) {
                      throw new Error("No Target Category ID");
                    }
                    if (
                      post.isReply || post.forumId == filter.targetCategoryId
                    ) {
                      // Can't recategorize a post
                      logAction = false;
                    } else {
                      this.changeThreadCategory(
                        post.threadId,
                        filter.targetCategoryId!,
                      ).catch((reason) => {
                        throw new Error(reason);
                      });
                    }
                    break;
                  case "reply":
                    if (!filter.replyMessage) {
                      throw new Error("No Reply Message");
                    }
                    if (post.isReply) {
                      // Can't reply to a post
                      logAction = false;
                    } else {
                      this.createPost({
                        threadId: post.threadId,
                        body: filter.replyMessage,
                      }).catch((reason) => {
                        throw new Error(reason);
                      });
                    }
                    break;
                  case "edit":
                    if (!filter.editContent) {
                      throw new Error("No Edit Content");
                    }

                    Promise.resolve(
                      filter.editContent(post),
                    ).then((newContent) => {
                      if (post.isReply) {
                        this.editPost(post.id, { body: newContent }).catch(
                          (reason) => {
                            throw new Error(reason);
                          },
                        );
                      } else {
                        this.editThread(post.threadId, {
                          body: newContent,
                          type: post.type,
                          title: post.title,
                        }).catch(
                          (reason) => {
                            throw new Error(reason);
                          },
                        );
                      }
                    });
                    break;
                }

                if (
                  (filter.discordWebhookUrl ??
                    this.defaultFilterDiscordWebhookUrl) && logAction
                ) {
                  // Create Embed & Log Action
                  const embed = {
                    title: "Filter Matched",
                    url: post.isReply
                      ? `https://${this.domain}.fandom.com/f/p/${post.threadId}/r/${post.id}`
                      : `https://${this.domain}.fandom.com/f/p/${post.threadId}`,
                    color: ActionEmbedColours[filter.action],
                    author: {
                      name: post.createdBy.name,
                      url:
                        `https://${this.domain}.fandom.com/f/u/${post.createdBy.id}`,
                      icon_url: post.createdBy.avatarUrl,
                    },
                    fields: [
                      { name: "Filter Name", value: filter.name, inline: true },
                      {
                        name: "Check Failed",
                        value: `\`${filteringRule.toString()}\``,
                        inline: true,
                      },
                      { name: "Action", value: filter.action, inline: true },
                      {
                        name: "Post Content",
                        value: post.rawContent.substring(0, 2000) ||
                          "No Body Content",
                      },
                    ],
                  };

                  const webhookUrl = filter.discordWebhookUrl ??
                    this.defaultFilterDiscordWebhookUrl;

                  fetch(webhookUrl!, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      embeds: [embed],
                    }),
                  }).then((response) => {
                    if (!response.ok) {
                      console.error(`Webhook Failed to Send`);
                    }
                  });
                }
              }
            });
          }
        });

        this.lastPostId = posts[0] ? BigInt(posts[0].id) : this.lastPostId
      }, (error) => {
        console.error(error);
      });
    }, this.filterInterval);
  }
}
