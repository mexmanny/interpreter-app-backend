import { env } from "../../config/env.js";
import { SheetSmsProvider } from "./SheetSmsProvider.js";
import { TwilioProvider } from "./TwilioProvider.js";

const provider =
  env.SMS_PROVIDER === "twilio"
    ? new TwilioProvider()
    : new SheetSmsProvider();

export default provider;
