import { prisma } from "../lib/prisma.js";
import { CreateInterpreterInput } from "./interpreter.schema.js";

export const createInterpreterRecord = (data: CreateInterpreterInput) => prisma.interpreter.create({ data });
export const listInterpreters = () => prisma.interpreter.findMany({ orderBy: { name: "asc" } });

export const findEligibleInterpreters = (criteria: { languageNeeded: string; coverageArea: string; transportRequired: boolean }) =>
  prisma.interpreter.findMany({
    where: {
      active: true,
      languages: { has: criteria.languageNeeded },
      coverageAreas: { has: criteria.coverageArea },
      ...(criteria.transportRequired ? { transportEligible: true } : {})
    }
  });
