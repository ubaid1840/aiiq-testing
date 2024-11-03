"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Loader from "../../loading";


export default function AutoRoute() {
  const pathname = usePathname()
  const router = useRouter();
  useEffect(() => {
    router.push(`${pathname}/files`)
  }, []);

  return (
    <Loader/>
  );
}