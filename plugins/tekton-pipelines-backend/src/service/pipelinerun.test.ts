import { getVoidLogger } from '@backstage/backend-common'
import { ConfigReader } from '@backstage/config'
import express from 'express'
import request from 'supertest'
import { createRouter } from './router'

describe('createRouter', () => {
  let app: express.Express

  beforeAll(async () => {
    const router = await createRouter({
      logger: getVoidLogger(),
      config: new ConfigReader({
        tekton: {
          baseUrl: process.env.APP_CONFIG_tekton_baseUrl,
          username: process.env.APP_CONFIG_tekton_authorizationBearerToken,
        },
      }),
    })
    app = express().use(router)
  })

  describe('GET /pipelineruns', () => {
    it('return project info', async () => {
      const namespace = "sample-go-application-build"
      const response = await request(app)
        .get('/pipelineruns')
        .query({ namespace: namespace})

      expect(response.statusType).toEqual(200)
      expect(Array.isArray(response.body)).toBeTruthy()

      expect(response.body[0]).toHaveProperty('name')
      expect(response.body[0]).toHaveProperty('namespace')
      expect(response.body[0]).toHaveProperty('status')
    })
  })
})
