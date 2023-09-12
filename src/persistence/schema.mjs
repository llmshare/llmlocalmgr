import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export default function schema() {
    return sqliteTable("weights", {
        id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
        model: text("model", { enum: ["map_reduce", "refine", "stuff"] })
            .notNull()
            .default("map_reduce"),
        root: text("root", { enum:   ["llama-2", "vicuna", "redpajama", "rwkv", "wizardlm", "wizardcoder", "wizardmath", "georgesung", "flagalpha", "goat-ai"] })
        .notNull(),
        quantization: text("quantization", {enum: ["asymetric", "symmetric"]})
        .notNull(),
        storagedatatype: text("storagedatatype", {enum: ["int2", "int3", "int4"]})
        .notNull(),
        runningdatatype: text("runningdatatype", { enum: ["float8", "float16", "float32"]})
        .notNull(),
        parameters: integer("parameters", {mode: "number"})
        .notNull(),
        sizegb: integer("sizegb", {mode: number})
        .notNull(),
        localid: text("localid")
        .notNull(),
        linkurl:  text("linkurl")
        .notNull()
        }
    );

}
