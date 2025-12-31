import axios from "axios";
import { appConfig } from "../../config/appConfig";

export async function sendSlackAlert(message: string) {
  await axios.post(appConfig.app.slack_webhook_url, {
    text: message,
  });
}
