import assert from "node:assert/strict";
import test from "node:test";
import { buildBeneficiaryNameIdentityKey } from "./identity";

test("beneficiary name identity keys are case and whitespace insensitive", () => {
  assert.equal(
    buildBeneficiaryNameIdentityKey({ firstName: "  Juan", middleName: " Dela  Cruz ", lastName: "Santos" }),
    buildBeneficiaryNameIdentityKey({ firstName: "juan", middleName: "dela cruz", lastName: "santos" }),
  );
});

test("a changed first, middle, or last name produces a different key", () => {
  const original = buildBeneficiaryNameIdentityKey({ firstName: "Juan", middleName: "Dela Cruz", lastName: "Santos" });
  assert.notEqual(original, buildBeneficiaryNameIdentityKey({ firstName: "Jose", middleName: "Dela Cruz", lastName: "Santos" }));
  assert.notEqual(original, buildBeneficiaryNameIdentityKey({ firstName: "Juan", middleName: "Pedro", lastName: "Santos" }));
  assert.notEqual(original, buildBeneficiaryNameIdentityKey({ firstName: "Juan", middleName: "Dela Cruz", lastName: "Reyes" }));
});
