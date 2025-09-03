import { redirect } from "next/navigation";

export default function Home() {
  // Redireciona para a página de login
  redirect("/login");
  
  // Este código nunca será executado devido ao redirecionamento
  return null;
}
