import {writeFile} from 'node:fs/promises'
import {z} from 'zod'
import {lessonSchema,sourceSchema,workSchema} from '../src/lib/schema.ts'
import {stateSchema} from '../src/lib/study.ts'
for(const [name,schema] of Object.entries({course:lessonSchema,sources:z.array(sourceSchema),works:z.array(workSchema),state:stateSchema}))await writeFile(new URL('../docs/'+name+'.schema.json',import.meta.url),JSON.stringify(z.toJSONSchema(schema),null,2)+'\n')
console.log('4 schemas exported')
