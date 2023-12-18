import type { AspidaClient, BasicHeaders } from 'aspida';
import type { Methods as Methods_16u040g } from './sample';

const api = <T>({ baseURL, fetch }: AspidaClient<T>) => {
  const prefix = (baseURL === undefined ? 'http://localhost:8000' : baseURL).replace(/\/$/, '');
  const PATH0 = '/sample';
  const GET = 'GET';
  const POST = 'POST';

  return {
    sample: {
      /**
       * @returns OK
       */
      get: (option?: { config?: T | undefined } | undefined) =>
        fetch<Methods_16u040g['get']['resBody'], BasicHeaders, Methods_16u040g['get']['status']>(prefix, PATH0, GET, option).json(),
      /**
       * @returns OK
       */
      $get: (option?: { config?: T | undefined } | undefined) =>
        fetch<Methods_16u040g['get']['resBody'], BasicHeaders, Methods_16u040g['get']['status']>(prefix, PATH0, GET, option).json().then(r => r.body),
      post: (option: { body: Methods_16u040g['post']['reqBody'], config?: T | undefined }) =>
        fetch<void, BasicHeaders, Methods_16u040g['post']['status']>(prefix, PATH0, POST, option).send(),
      $post: (option: { body: Methods_16u040g['post']['reqBody'], config?: T | undefined }) =>
        fetch<void, BasicHeaders, Methods_16u040g['post']['status']>(prefix, PATH0, POST, option).send().then(r => r.body),
      $path: () => `${prefix}${PATH0}`,
    },
  };
};

export type ApiInstance = ReturnType<typeof api>;
export default api;
