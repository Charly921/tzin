// AUTO-GENERATED scale fixture (100 endpoints) - our contract model
import { t } from '../../src/schema.js'
import { contract, impl } from '../../src/contract.js'
import { client } from '../../src/client.js'

export const list_res0_0 = contract({
  method: 'GET',
  path: '/res0',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field0: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res0_1 = contract({
  method: 'GET',
  path: '/res0/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field1: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res0_2 = contract({
  method: 'POST',
  path: '/res0',
  body: t.Object({ id: t.String(), name: t.String(), field2: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field2: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res0_3 = contract({
  method: 'PUT',
  path: '/res0/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field3: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field3: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res0_4 = contract({
  method: 'DELETE',
  path: '/res0/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field4: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res1_5 = contract({
  method: 'GET',
  path: '/res1',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field5: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res1_6 = contract({
  method: 'GET',
  path: '/res1/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field6: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res1_7 = contract({
  method: 'POST',
  path: '/res1',
  body: t.Object({ id: t.String(), name: t.String(), field7: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field7: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res1_8 = contract({
  method: 'PUT',
  path: '/res1/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field8: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field8: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res1_9 = contract({
  method: 'DELETE',
  path: '/res1/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field9: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res2_10 = contract({
  method: 'GET',
  path: '/res2',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field10: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res2_11 = contract({
  method: 'GET',
  path: '/res2/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field11: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res2_12 = contract({
  method: 'POST',
  path: '/res2',
  body: t.Object({ id: t.String(), name: t.String(), field12: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field12: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res2_13 = contract({
  method: 'PUT',
  path: '/res2/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field13: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field13: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res2_14 = contract({
  method: 'DELETE',
  path: '/res2/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field14: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res3_15 = contract({
  method: 'GET',
  path: '/res3',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field15: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res3_16 = contract({
  method: 'GET',
  path: '/res3/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field16: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res3_17 = contract({
  method: 'POST',
  path: '/res3',
  body: t.Object({ id: t.String(), name: t.String(), field17: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field17: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res3_18 = contract({
  method: 'PUT',
  path: '/res3/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field18: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field18: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res3_19 = contract({
  method: 'DELETE',
  path: '/res3/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field19: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res4_20 = contract({
  method: 'GET',
  path: '/res4',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field20: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res4_21 = contract({
  method: 'GET',
  path: '/res4/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field21: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res4_22 = contract({
  method: 'POST',
  path: '/res4',
  body: t.Object({ id: t.String(), name: t.String(), field22: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field22: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res4_23 = contract({
  method: 'PUT',
  path: '/res4/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field23: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field23: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res4_24 = contract({
  method: 'DELETE',
  path: '/res4/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field24: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res5_25 = contract({
  method: 'GET',
  path: '/res5',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field25: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res5_26 = contract({
  method: 'GET',
  path: '/res5/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field26: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res5_27 = contract({
  method: 'POST',
  path: '/res5',
  body: t.Object({ id: t.String(), name: t.String(), field27: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field27: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res5_28 = contract({
  method: 'PUT',
  path: '/res5/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field28: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field28: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res5_29 = contract({
  method: 'DELETE',
  path: '/res5/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field29: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res6_30 = contract({
  method: 'GET',
  path: '/res6',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field30: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res6_31 = contract({
  method: 'GET',
  path: '/res6/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field31: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res6_32 = contract({
  method: 'POST',
  path: '/res6',
  body: t.Object({ id: t.String(), name: t.String(), field32: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field32: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res6_33 = contract({
  method: 'PUT',
  path: '/res6/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field33: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field33: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res6_34 = contract({
  method: 'DELETE',
  path: '/res6/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field34: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res7_35 = contract({
  method: 'GET',
  path: '/res7',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field35: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res7_36 = contract({
  method: 'GET',
  path: '/res7/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field36: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res7_37 = contract({
  method: 'POST',
  path: '/res7',
  body: t.Object({ id: t.String(), name: t.String(), field37: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field37: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res7_38 = contract({
  method: 'PUT',
  path: '/res7/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field38: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field38: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res7_39 = contract({
  method: 'DELETE',
  path: '/res7/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field39: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res8_40 = contract({
  method: 'GET',
  path: '/res8',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field40: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res8_41 = contract({
  method: 'GET',
  path: '/res8/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field41: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res8_42 = contract({
  method: 'POST',
  path: '/res8',
  body: t.Object({ id: t.String(), name: t.String(), field42: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field42: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res8_43 = contract({
  method: 'PUT',
  path: '/res8/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field43: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field43: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res8_44 = contract({
  method: 'DELETE',
  path: '/res8/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field44: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res9_45 = contract({
  method: 'GET',
  path: '/res9',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field45: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res9_46 = contract({
  method: 'GET',
  path: '/res9/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field46: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res9_47 = contract({
  method: 'POST',
  path: '/res9',
  body: t.Object({ id: t.String(), name: t.String(), field47: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field47: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res9_48 = contract({
  method: 'PUT',
  path: '/res9/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field48: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field48: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res9_49 = contract({
  method: 'DELETE',
  path: '/res9/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field49: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res10_50 = contract({
  method: 'GET',
  path: '/res10',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field50: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res10_51 = contract({
  method: 'GET',
  path: '/res10/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field51: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res10_52 = contract({
  method: 'POST',
  path: '/res10',
  body: t.Object({ id: t.String(), name: t.String(), field52: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field52: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res10_53 = contract({
  method: 'PUT',
  path: '/res10/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field53: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field53: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res10_54 = contract({
  method: 'DELETE',
  path: '/res10/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field54: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res11_55 = contract({
  method: 'GET',
  path: '/res11',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field55: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res11_56 = contract({
  method: 'GET',
  path: '/res11/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field56: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res11_57 = contract({
  method: 'POST',
  path: '/res11',
  body: t.Object({ id: t.String(), name: t.String(), field57: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field57: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res11_58 = contract({
  method: 'PUT',
  path: '/res11/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field58: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field58: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res11_59 = contract({
  method: 'DELETE',
  path: '/res11/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field59: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res12_60 = contract({
  method: 'GET',
  path: '/res12',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field60: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res12_61 = contract({
  method: 'GET',
  path: '/res12/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field61: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res12_62 = contract({
  method: 'POST',
  path: '/res12',
  body: t.Object({ id: t.String(), name: t.String(), field62: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field62: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res12_63 = contract({
  method: 'PUT',
  path: '/res12/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field63: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field63: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res12_64 = contract({
  method: 'DELETE',
  path: '/res12/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field64: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res13_65 = contract({
  method: 'GET',
  path: '/res13',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field65: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res13_66 = contract({
  method: 'GET',
  path: '/res13/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field66: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res13_67 = contract({
  method: 'POST',
  path: '/res13',
  body: t.Object({ id: t.String(), name: t.String(), field67: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field67: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res13_68 = contract({
  method: 'PUT',
  path: '/res13/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field68: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field68: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res13_69 = contract({
  method: 'DELETE',
  path: '/res13/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field69: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res14_70 = contract({
  method: 'GET',
  path: '/res14',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field70: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res14_71 = contract({
  method: 'GET',
  path: '/res14/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field71: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res14_72 = contract({
  method: 'POST',
  path: '/res14',
  body: t.Object({ id: t.String(), name: t.String(), field72: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field72: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res14_73 = contract({
  method: 'PUT',
  path: '/res14/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field73: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field73: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res14_74 = contract({
  method: 'DELETE',
  path: '/res14/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field74: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res15_75 = contract({
  method: 'GET',
  path: '/res15',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field75: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res15_76 = contract({
  method: 'GET',
  path: '/res15/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field76: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res15_77 = contract({
  method: 'POST',
  path: '/res15',
  body: t.Object({ id: t.String(), name: t.String(), field77: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field77: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res15_78 = contract({
  method: 'PUT',
  path: '/res15/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field78: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field78: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res15_79 = contract({
  method: 'DELETE',
  path: '/res15/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field79: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res16_80 = contract({
  method: 'GET',
  path: '/res16',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field80: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res16_81 = contract({
  method: 'GET',
  path: '/res16/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field81: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res16_82 = contract({
  method: 'POST',
  path: '/res16',
  body: t.Object({ id: t.String(), name: t.String(), field82: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field82: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res16_83 = contract({
  method: 'PUT',
  path: '/res16/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field83: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field83: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res16_84 = contract({
  method: 'DELETE',
  path: '/res16/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field84: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res17_85 = contract({
  method: 'GET',
  path: '/res17',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field85: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res17_86 = contract({
  method: 'GET',
  path: '/res17/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field86: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res17_87 = contract({
  method: 'POST',
  path: '/res17',
  body: t.Object({ id: t.String(), name: t.String(), field87: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field87: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res17_88 = contract({
  method: 'PUT',
  path: '/res17/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field88: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field88: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res17_89 = contract({
  method: 'DELETE',
  path: '/res17/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field89: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res18_90 = contract({
  method: 'GET',
  path: '/res18',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field90: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res18_91 = contract({
  method: 'GET',
  path: '/res18/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field91: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res18_92 = contract({
  method: 'POST',
  path: '/res18',
  body: t.Object({ id: t.String(), name: t.String(), field92: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field92: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res18_93 = contract({
  method: 'PUT',
  path: '/res18/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field93: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field93: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res18_94 = contract({
  method: 'DELETE',
  path: '/res18/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field94: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const list_res19_95 = contract({
  method: 'GET',
  path: '/res19',
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field95: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const get_res19_96 = contract({
  method: 'GET',
  path: '/res19/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field96: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const create_res19_97 = contract({
  method: 'POST',
  path: '/res19',
  body: t.Object({ id: t.String(), name: t.String(), field97: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field97: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const update_res19_98 = contract({
  method: 'PUT',
  path: '/res19/{id}',
  params: t.Object({ id: t.String() }),
  body: t.Object({ id: t.String(), name: t.String(), field98: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field98: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})

export const remove_res19_99 = contract({
  method: 'DELETE',
  path: '/res19/{id}',
  params: t.Object({ id: t.String() }),
  responses: {
    200: t.Object({ ok: t.Boolean(), item: t.Object({ id: t.String(), name: t.String(), field99: t.Optional(t.Number()), tags: t.Array(t.String()), meta: t.Object({ k: t.String(), v: t.Number() }) }), at: t.String() }),
  },
})
export const r_list_res0_0 = impl(list_res0_0, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res0_1 = impl(get_res0_1, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res0_2 = impl(create_res0_2, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res0_3 = impl(update_res0_3, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res0_4 = impl(remove_res0_4, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res1_5 = impl(list_res1_5, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res1_6 = impl(get_res1_6, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res1_7 = impl(create_res1_7, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res1_8 = impl(update_res1_8, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res1_9 = impl(remove_res1_9, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res2_10 = impl(list_res2_10, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res2_11 = impl(get_res2_11, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res2_12 = impl(create_res2_12, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res2_13 = impl(update_res2_13, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res2_14 = impl(remove_res2_14, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res3_15 = impl(list_res3_15, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res3_16 = impl(get_res3_16, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res3_17 = impl(create_res3_17, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res3_18 = impl(update_res3_18, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res3_19 = impl(remove_res3_19, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res4_20 = impl(list_res4_20, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res4_21 = impl(get_res4_21, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res4_22 = impl(create_res4_22, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res4_23 = impl(update_res4_23, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res4_24 = impl(remove_res4_24, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res5_25 = impl(list_res5_25, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res5_26 = impl(get_res5_26, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res5_27 = impl(create_res5_27, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res5_28 = impl(update_res5_28, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res5_29 = impl(remove_res5_29, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res6_30 = impl(list_res6_30, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res6_31 = impl(get_res6_31, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res6_32 = impl(create_res6_32, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res6_33 = impl(update_res6_33, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res6_34 = impl(remove_res6_34, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res7_35 = impl(list_res7_35, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res7_36 = impl(get_res7_36, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res7_37 = impl(create_res7_37, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res7_38 = impl(update_res7_38, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res7_39 = impl(remove_res7_39, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res8_40 = impl(list_res8_40, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res8_41 = impl(get_res8_41, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res8_42 = impl(create_res8_42, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res8_43 = impl(update_res8_43, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res8_44 = impl(remove_res8_44, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res9_45 = impl(list_res9_45, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res9_46 = impl(get_res9_46, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res9_47 = impl(create_res9_47, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res9_48 = impl(update_res9_48, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res9_49 = impl(remove_res9_49, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res10_50 = impl(list_res10_50, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res10_51 = impl(get_res10_51, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res10_52 = impl(create_res10_52, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res10_53 = impl(update_res10_53, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res10_54 = impl(remove_res10_54, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res11_55 = impl(list_res11_55, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res11_56 = impl(get_res11_56, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res11_57 = impl(create_res11_57, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res11_58 = impl(update_res11_58, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res11_59 = impl(remove_res11_59, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res12_60 = impl(list_res12_60, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res12_61 = impl(get_res12_61, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res12_62 = impl(create_res12_62, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res12_63 = impl(update_res12_63, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res12_64 = impl(remove_res12_64, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res13_65 = impl(list_res13_65, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res13_66 = impl(get_res13_66, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res13_67 = impl(create_res13_67, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res13_68 = impl(update_res13_68, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res13_69 = impl(remove_res13_69, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res14_70 = impl(list_res14_70, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res14_71 = impl(get_res14_71, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res14_72 = impl(create_res14_72, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res14_73 = impl(update_res14_73, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res14_74 = impl(remove_res14_74, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res15_75 = impl(list_res15_75, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res15_76 = impl(get_res15_76, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res15_77 = impl(create_res15_77, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res15_78 = impl(update_res15_78, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res15_79 = impl(remove_res15_79, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res16_80 = impl(list_res16_80, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res16_81 = impl(get_res16_81, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res16_82 = impl(create_res16_82, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res16_83 = impl(update_res16_83, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res16_84 = impl(remove_res16_84, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res17_85 = impl(list_res17_85, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res17_86 = impl(get_res17_86, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res17_87 = impl(create_res17_87, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res17_88 = impl(update_res17_88, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res17_89 = impl(remove_res17_89, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res18_90 = impl(list_res18_90, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res18_91 = impl(get_res18_91, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res18_92 = impl(create_res18_92, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res18_93 = impl(update_res18_93, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res18_94 = impl(remove_res18_94, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_list_res19_95 = impl(list_res19_95, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_get_res19_96 = impl(get_res19_96, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_create_res19_97 = impl(create_res19_97, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_update_res19_98 = impl(update_res19_98, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))
export const r_remove_res19_99 = impl(remove_res19_99, async () => ({
  status: 200,
  body: { ok: true, item: { id: 'x', name: 'y', tags: [], meta: { k: 'a', v: 1 } }, at: 'now' },
}))

export const endpoints = {
  list_res0_0: r_list_res0_0,
  get_res0_1: r_get_res0_1,
  create_res0_2: r_create_res0_2,
  update_res0_3: r_update_res0_3,
  remove_res0_4: r_remove_res0_4,
  list_res1_5: r_list_res1_5,
  get_res1_6: r_get_res1_6,
  create_res1_7: r_create_res1_7,
  update_res1_8: r_update_res1_8,
  remove_res1_9: r_remove_res1_9,
  list_res2_10: r_list_res2_10,
  get_res2_11: r_get_res2_11,
  create_res2_12: r_create_res2_12,
  update_res2_13: r_update_res2_13,
  remove_res2_14: r_remove_res2_14,
  list_res3_15: r_list_res3_15,
  get_res3_16: r_get_res3_16,
  create_res3_17: r_create_res3_17,
  update_res3_18: r_update_res3_18,
  remove_res3_19: r_remove_res3_19,
  list_res4_20: r_list_res4_20,
  get_res4_21: r_get_res4_21,
  create_res4_22: r_create_res4_22,
  update_res4_23: r_update_res4_23,
  remove_res4_24: r_remove_res4_24,
  list_res5_25: r_list_res5_25,
  get_res5_26: r_get_res5_26,
  create_res5_27: r_create_res5_27,
  update_res5_28: r_update_res5_28,
  remove_res5_29: r_remove_res5_29,
  list_res6_30: r_list_res6_30,
  get_res6_31: r_get_res6_31,
  create_res6_32: r_create_res6_32,
  update_res6_33: r_update_res6_33,
  remove_res6_34: r_remove_res6_34,
  list_res7_35: r_list_res7_35,
  get_res7_36: r_get_res7_36,
  create_res7_37: r_create_res7_37,
  update_res7_38: r_update_res7_38,
  remove_res7_39: r_remove_res7_39,
  list_res8_40: r_list_res8_40,
  get_res8_41: r_get_res8_41,
  create_res8_42: r_create_res8_42,
  update_res8_43: r_update_res8_43,
  remove_res8_44: r_remove_res8_44,
  list_res9_45: r_list_res9_45,
  get_res9_46: r_get_res9_46,
  create_res9_47: r_create_res9_47,
  update_res9_48: r_update_res9_48,
  remove_res9_49: r_remove_res9_49,
  list_res10_50: r_list_res10_50,
  get_res10_51: r_get_res10_51,
  create_res10_52: r_create_res10_52,
  update_res10_53: r_update_res10_53,
  remove_res10_54: r_remove_res10_54,
  list_res11_55: r_list_res11_55,
  get_res11_56: r_get_res11_56,
  create_res11_57: r_create_res11_57,
  update_res11_58: r_update_res11_58,
  remove_res11_59: r_remove_res11_59,
  list_res12_60: r_list_res12_60,
  get_res12_61: r_get_res12_61,
  create_res12_62: r_create_res12_62,
  update_res12_63: r_update_res12_63,
  remove_res12_64: r_remove_res12_64,
  list_res13_65: r_list_res13_65,
  get_res13_66: r_get_res13_66,
  create_res13_67: r_create_res13_67,
  update_res13_68: r_update_res13_68,
  remove_res13_69: r_remove_res13_69,
  list_res14_70: r_list_res14_70,
  get_res14_71: r_get_res14_71,
  create_res14_72: r_create_res14_72,
  update_res14_73: r_update_res14_73,
  remove_res14_74: r_remove_res14_74,
  list_res15_75: r_list_res15_75,
  get_res15_76: r_get_res15_76,
  create_res15_77: r_create_res15_77,
  update_res15_78: r_update_res15_78,
  remove_res15_79: r_remove_res15_79,
  list_res16_80: r_list_res16_80,
  get_res16_81: r_get_res16_81,
  create_res16_82: r_create_res16_82,
  update_res16_83: r_update_res16_83,
  remove_res16_84: r_remove_res16_84,
  list_res17_85: r_list_res17_85,
  get_res17_86: r_get_res17_86,
  create_res17_87: r_create_res17_87,
  update_res17_88: r_update_res17_88,
  remove_res17_89: r_remove_res17_89,
  list_res18_90: r_list_res18_90,
  get_res18_91: r_get_res18_91,
  create_res18_92: r_create_res18_92,
  update_res18_93: r_update_res18_93,
  remove_res18_94: r_remove_res18_94,
  list_res19_95: r_list_res19_95,
  get_res19_96: r_get_res19_96,
  create_res19_97: r_create_res19_97,
  update_res19_98: r_update_res19_98,
  remove_res19_99: r_remove_res19_99,
}

type Contracts = { [K in keyof typeof endpoints]: (typeof endpoints)[K]['contract'] }
export type ApiClient = ReturnType<typeof client<Contracts>>
export function makeApi(base: string): ApiClient {
  return client(Object.fromEntries(Object.entries(endpoints).map(([k, v]) => [k, v.contract])) as Contracts, base)
}

// forces instantiation of every endpoint's call signature through the mapped type
export type AllSignatures = { [K in keyof ApiClient]: Parameters<ApiClient[K]> }

export async function demo(api: ApiClient) {
  const r = await api.get_res0_1({ params: { id: 'abc' } })
  if ('error' in r.data) return r.data.error
  return r.data.item.name
}
