import { describe, expect, it } from "vitest";

import {
  AUTH_MESSAGES,
  challengeExpired,
  confirmSignupMessage,
  signinMessage,
  signupMessage,
} from "@/lib/auth/messages";

const BAD_REQUEST = 400;
const FORBIDDEN = 403;
const CONFLICT = 409;
const UNPROCESSABLE = 422;

describe("signinMessage", () => {
  it("keeps the generic message for wrong credentials", () => {
    expect(signinMessage(401)).toBe(AUTH_MESSAGES.credentials);
  });

  it("names a disabled account, which the user can act on", () => {
    expect(signinMessage(FORBIDDEN)).toBe(AUTH_MESSAGES.inactive);
  });
});

describe("challengeExpired", () => {
  it("recognises the expired login token by its marker", () => {
    expect(challengeExpired(BAD_REQUEST, "The login token has expired")).toBe(true);
  });

  it("does not treat every 400 as an expired challenge", () => {
    expect(challengeExpired(BAD_REQUEST, "Invalid code")).toBe(false);
  });
});

describe("signupMessage", () => {
  it("tells an existing account apart from a validation error", () => {
    expect(signupMessage(CONFLICT, "A account with this email already exists.")).toBe(
      AUTH_MESSAGES.signupEmailTaken,
    );

    expect(signupMessage(UNPROCESSABLE, "A senha deve ter ao menos 8 caracteres.")).toBe(
      "A senha deve ter ao menos 8 caracteres.",
    );
  });
});

describe("confirmSignupMessage", () => {
  it("separates the three meanings the API packs into 409", () => {
    expect(
      confirmSignupMessage(CONFLICT, "Effort limit exceeded. Please try again later."),
    ).toBe(AUTH_MESSAGES.signupRetryLimit);

    expect(
      confirmSignupMessage(CONFLICT, "A account with this email already exists."),
    ).toBe(AUTH_MESSAGES.signupEmailTaken);

    expect(
      confirmSignupMessage(CONFLICT, "Invalid verification code. Please try again."),
    ).toBe(AUTH_MESSAGES.signupInvalidCode);
  });

  it("answers an unknown signup as an invalid code", () => {
    // A API passou a responder 409 quando o e-mail não tem cadastro pendente,
    // no lugar do 500 que estourava. A tela precisa tratar os dois iguais.
    expect(
      confirmSignupMessage(CONFLICT, "Invalid verification code. Please try again."),
    ).toBe(AUTH_MESSAGES.signupInvalidCode);
  });
});
