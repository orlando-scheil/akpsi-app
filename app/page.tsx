// Root page — redirects all visitors to /login.
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
