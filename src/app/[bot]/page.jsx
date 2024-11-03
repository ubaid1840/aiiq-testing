import MainPage from "@/Components/production/mainPage/mainpage";
import handleGetAllRoutes from "@/function/getRoutes";
import { headers } from "next/headers";

export async function generateMetadata({ params, searchParams }, parent) {
  const headerList = headers();
  const pathname = headerList.get("x-current-path");
  const list1 = await handleGetAllRoutes();
  let returnItem = [];
  if (list1.length > 0) {
    returnItem = list1.filter((item) =>
      pathname?.toLowerCase().includes(item?.name?.toLowerCase())
    );
  }
  return {
    title: `AIIQ Engine-${returnItem.length > 0 ? returnItem[0]?.name : ""}`,
  };
}

export default async function Page({ params, searchParams }) {
  const headerList = headers();
  const pathname = headerList.get("x-current-path");
  const list1 = await handleGetAllRoutes();
  let returnItem = [];
  if (list1.length > 0) {
    returnItem = list1.filter((item) =>
      pathname?.toLowerCase().includes(item?.name?.toLowerCase())
    );
  }

  return (
    <MainPage
      backendUrl={returnItem.length > 0 ? returnItem[0]?.value : ""}
      allRoutes={list1}
    />
  );
}
