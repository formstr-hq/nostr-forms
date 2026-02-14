import { getValidationRules } from "./index";
import { AnswerTypes, ValidationRuleTypes } from "../../../nostr/types";

describe("Validation Logic", () => {
    describe("NumRange", () => {
        it("should validate number within range", async () => {
            const rules = getValidationRules(AnswerTypes.number, {
                validationRules: {
                    [ValidationRuleTypes.range]: { min: 10, max: 20 },
                },
            });
            const validator = (rules[0] as any).validator;
            if (!validator) throw new Error("Validator not found");

            await expect(validator(null, [15])).resolves.not.toThrow();
            await expect(validator(null, [10])).resolves.not.toThrow();
            await expect(validator(null, [20])).resolves.not.toThrow();
        });

        it("should reject number below min", async () => {
            const rules = getValidationRules(AnswerTypes.number, {
                validationRules: {
                    [ValidationRuleTypes.range]: { min: 10, max: 20 },
                },
            });
            const validator = (rules[0] as any).validator;
            if (!validator) throw new Error("Validator not found");

            await expect(validator(null, [5])).rejects.toMatch("Please enter number more than 10");
        });

        it("should reject number above max", async () => {
            const rules = getValidationRules(AnswerTypes.number, {
                validationRules: {
                    [ValidationRuleTypes.range]: { min: 10, max: 20 },
                },
            });
            const validator = (rules[0] as any).validator;
            if (!validator) throw new Error("Validator not found");

            await expect(validator(null, [25])).rejects.toMatch("Please enter number less than 20");
        });
    });

    describe("MinLength", () => {
        it("should validate string with minimum length", async () => {
            const rules = getValidationRules(AnswerTypes.shortText, {
                validationRules: {
                    [ValidationRuleTypes.min]: { min: 5 },
                },
            });
            const validator = (rules[0] as any).validator;
            if (!validator) throw new Error("Validator not found");

            await expect(validator(null, ["hello"])).resolves.not.toThrow();
        });

        it("should reject string shorter than min length", async () => {
            const rules = getValidationRules(AnswerTypes.shortText, {
                validationRules: {
                    [ValidationRuleTypes.min]: { min: 5 },
                },
            });
            const validator = (rules[0] as any).validator;
            if (!validator) throw new Error("Validator not found");

            await expect(validator(null, ["hi"])).rejects.toMatch("Please enter more than 5 chars");
        });
    });

    describe("Match (Simple)", () => {
        it("should validate correct answer", async () => {
            const rules = getValidationRules(AnswerTypes.shortText, {
                validationRules: {
                    [ValidationRuleTypes.match]: { answer: "correct" },
                },
            });
            const validator = (rules[0] as any).validator;
            if (!validator) throw new Error("Validator not found");

            await expect(validator(null, ["correct"])).resolves.not.toThrow();
        });

        it("should reject incorrect answer", async () => {
            const rules = getValidationRules(AnswerTypes.shortText, {
                validationRules: {
                    [ValidationRuleTypes.match]: { answer: "correct" },
                },
            });
            const validator = (rules[0] as any).validator;
            if (!validator) throw new Error("Validator not found");

            await expect(validator(null, ["wrong"])).rejects.toMatch("This is not the correct answer for this question");
        });
    });

    describe("Regex", () => {
        it("should validate matching pattern", async () => {
            const rules = getValidationRules(AnswerTypes.shortText, {
                validationRules: {
                    [ValidationRuleTypes.regex]: { pattern: "^[a-z]+$", errorMessage: "Only lowercase letters" },
                },
            });
            const validator = (rules[0] as any).validator;
            if (!validator) throw new Error("Validator not found");

            await expect(validator(null, ["abc"])).resolves.not.toThrow();
        });

        it("should reject non-matching pattern", async () => {
            const rules = getValidationRules(AnswerTypes.shortText, {
                validationRules: {
                    [ValidationRuleTypes.regex]: { pattern: "^[a-z]+$", errorMessage: "Only lowercase letters" },
                },
            });
            const validator = (rules[0] as any).validator;
            if (!validator) throw new Error("Validator not found");

            await expect(validator(null, ["123"])).rejects.toMatch("Only lowercase letters");
        });
    });
});
