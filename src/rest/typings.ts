type StringObject = { [key: string]: string };

export interface RequestHandlerSettings {
  /** Wiki Domain (see DiscussionsClientSettings)*/
  domain: string;
  /** Request controller */
  controller: string;
  /** Request method (e.g. create, delete, getThreads) */
  method: string;
  /** HTTP Request method (e.g. GET, POST, DELETE, PATCH) */
  requestMethod: string;
  /** Request query parameters */
  params: StringObject;
  /** Request body */
  body?: Record<string, unknown> | null;
  /** Whether or not to use authentication */
  useAuthentication?:
    boolean; /**  Authentication token (if useAuthentication is set to true)*/
  authToken?: string;
}
