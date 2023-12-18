/* eslint-disable */
import type * as Types from '../@types'

export type Methods = {
  get: {
    status: 200
    /** OK */
    resBody: Types.Sample
  }

  post: {
    status: 200
    reqBody: Types.Sample
  }
}
