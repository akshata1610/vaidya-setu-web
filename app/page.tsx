import Lab from "@/components/lab";
import { chatGPTSignInPath, getChatGPTUser } from "./chatgpt-auth";
export const dynamic = "force-dynamic";
export default async function Home() {
  const user = await getChatGPTUser();
  return <Lab identity={user ? { name: user.displayName, signedIn: true } : { name: "", signedIn: false }} signInHref={chatGPTSignInPath("/")} />;
}
