import { prisma } from "../lib/prisma.js";
import { CreateInterpreterInput, UpdateInterpreterInput } from "./interpreter.schema.js";

export const createInterpreterRecord = (data: CreateInterpreterInput) => prisma.interpreter.create({ data });
export const listInterpreters = () => prisma.interpreter.findMany({ orderBy: { name: "asc" } });
export const findInterpreterById = (id: string) => prisma.interpreter.findUnique({ where: { id } });
export const updateInterpreterRecord = (id: string, data: UpdateInterpreterInput) =>
  prisma.interpreter.update({ where: { id }, data });
export const deleteInterpreterRecord = (id: string) => prisma.interpreter.delete({ where: { id } });

export const interpreterHasRelatedRecords = async (id: string) => {
  const counts = await prisma.interpreter.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          assignments: true,
          requests: true,
          offers: true,
        },
      },
    },
  });

  if (!counts) {
    return false;
  }

  const { assignments, requests, offers } = counts._count;
  return assignments > 0 || requests > 0 || offers > 0;
};

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
