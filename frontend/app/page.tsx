"use client";
import AdminHeader from "../components/adminHeader";
import Header from "../components/header";
import Questions from "../components/questions";
export default function Home() {
  const ISSERVER = typeof window === "undefined";
  
  const storedToken = ISSERVER ? null : localStorage.getItem("admin_token");

  return (
    <>
      {storedToken ? <AdminHeader /> : <Header />}
      <Questions />
    </>
  );
}
