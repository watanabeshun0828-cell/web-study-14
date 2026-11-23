import { z } from 'zod'
const text=z.string().trim().min(1)
export const calculationSchema=z.object({expression:text,operator:z.enum(['sum','difference','product','quotient','power']),operands:z.array(z.number().finite()).min(1),result:z.number().finite(),unit:text,rounding:z.enum(['none','floor','ceil','round'])})
const common=z.object({id:text,sectionId:text,category:text,prompt:text,explanation:text,referenceIds:z.array(text).min(1),assumptions:text,calculations:z.array(calculationSchema),code:text.optional()})
export const questionSchema=z.discriminatedUnion('format',[
  common.extend({format:z.literal('choice'),choices:z.array(z.object({id:text,text})).length(4),correctChoiceId:text}),
  common.extend({format:z.literal('numeric'),fields:z.array(z.object({id:text,label:text,expected:z.number().finite(),unit:text,calculationIndex:z.number().int().min(0)})).min(1)})
])
export const lessonSchema=z.object({schemaVersion:z.literal(1),id:text,day:z.number().int().min(1).max(14),title:text,category:text,goals:z.array(text).min(2),referenceIds:z.array(text).min(1),sections:z.array(z.object({id:text,title:text,paragraphs:z.array(text).min(2),keyPoint:text,referenceIds:z.array(text).min(1),code:text.optional(),diagram:z.object({title:text,description:text,items:z.array(z.object({label:text,detail:text})).min(2)}).optional()})).min(2).max(4),questions:z.array(questionSchema).min(8).max(16)})
export const sourceSchema=z.object({id:text,title:text,url:z.url().nullable(),checkedAt:z.iso.date(),appliesTo:text,location:text,role:text,notes:text})
export const glossarySchema=z.array(z.object({id:text,term:text,description:text,referenceIds:z.array(text).min(1)}))
export const workSchema=z.object({id:text,day:z.number().int().min(1).max(14),title:text,intro:text,kind:z.enum(['excel','web','color','it']),referenceIds:z.array(text).min(1),instructions:z.array(text).min(1),checks:z.array(z.object({id:text,label:text})).min(1),prompt:text,starterUrl:text.optional(),answerUrl:text.optional(),fileLabel:text.optional(),starterHTML:text.optional(),answerHTML:text.optional(),css:z.string().optional(),initial:z.record(z.string(),z.number().finite()).optional(),rules:z.array(z.object({key:text,op:z.enum(['eq','gte','lte']),value:z.number().finite(),label:text})).optional()})
export type Question=z.infer<typeof questionSchema>
export type Lesson=z.infer<typeof lessonSchema>
export type Calculation=z.infer<typeof calculationSchema>
export type Work=z.infer<typeof workSchema>
