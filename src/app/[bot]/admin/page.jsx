import ProdAdmin from "@/Components/production/admin/admin";
import handleGetAllRoutes from "@/function/getRoutes";
import { headers } from "next/headers";

const prodItems = [
  "files",
  "configuration",
  "sessions",
  "appearance",
  "usermanagement",
  "routemanagement",
];

export async function generateMetadata({ params, searchParams }, parent) {
  const headerList = headers();
  const pathname = headerList.get("x-current-path");
  const list1 = await handleGetAllRoutes();
  let returnItem = [];
  if (list1.length > 0) {
    returnItem = list1.filter((item) =>
      pathname.toLowerCase().includes(item.name.toLowerCase())
    );
  }
  let secondItem = [];
  secondItem = prodItems.filter((item) =>
    pathname.toLowerCase().includes(item)
  );

  return {
    title: `AIIQ-${returnItem.length > 0 ? returnItem[0]?.name : ""}-${
      secondItem.length > 0 ? secondItem[0] : ""
    }`,
  };
}

export default async function Page({ params, searchParams }) {
  const headerList = headers();
  const pathname = headerList.get("x-current-path");
  const list1 = await handleGetAllRoutes();
  let returnItem = [];
  if (list1.length > 0) {
    returnItem = list1.filter((item) =>
      pathname?.toLowerCase()?.includes(item?.name?.toLowerCase())
    );
  }

  return (
    <ProdAdmin
      backendUrl={returnItem.length > 0 ? returnItem[0]?.value : ""}
      allRoutes={list1}
    />
  );
}
