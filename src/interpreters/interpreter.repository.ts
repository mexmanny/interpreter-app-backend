import { prisma } from "../lib/prisma.js";
import { CreateInterpreterInput } from "./interpreter.schema.js";

export const createInterpreterRecord = (data: CreateInterpreterInput) => prisma.interpreter.create({ data });
export const listInterpreters = () => prisma.interpreter.findMany({ orderBy: { name: "asc" } });

const normalizeMatchValue = (value: string) => value.trim().toLowerCase();

const matchesField = (values: string[], input: string) =>
  values.some((value) => normalizeMatchValue(value) === normalizeMatchValue(input));

export const findEligibleInterpreters = async (criteria: {
  languageNeeded: string;
  coverageArea: string;
  transportRequired: boolean;
}) => {
  const interpreters = await prisma.interpreter.findMany({
    where: {
      active: true,
      ...(criteria.transportRequired ? { transportEligible: true } : {}),
    },
    orderBy: { name: "asc" },
  });

  return interpreters.filter(
    (interpreter) =>
      matchesField(interpreter.languages, criteria.languageNeeded) &&
      matchesField(interpreter.coverageAreas, criteria.coverageArea),
  );
};
