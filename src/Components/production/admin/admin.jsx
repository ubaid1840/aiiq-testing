"use client";
import useCheckSession from "@/function/checkSession";
import PanelLayout from "@/Layout/CustomLayout";
import { useEffect, useState } from "react";
import Files from "@/Components/production/files";
import Configuration from "@/Components/production/Configuration";
import Sessions from "@/Components/production/sessions";
import User from "@/Components/production/usermanagement";
import Route from "@/Components/production/routemanagement";
import Appearance from "@/Components/production/appearance";
import Loader from "../../../../loading";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EncryptCookie } from "@/function/cookiesFunctions";
import Cookies from "js-cookie";
import handleTokenSave from "@/function/tokenFunction";

export default function Page({ backendUrl, allRoutes }) {
  const checkSession = useCheckSession();
  const searchParams = useSearchParams();
  const [routes, setRoutes] = useState([]);
  const [currentPage, setCurrentPage] = useState("files");
  const [loading, setLoading] = useState(true);
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const search = searchParams.get("page");
    if (search) {
      setCurrentPage(search);
    } else {
      router.push(pathname + "?page=files")
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    checkSession(allRoutes).then((item) => {
      if (item) {
        const key = EncryptCookie(
          JSON.stringify({
            token: item.token,
            email: item.email,
          })
        );
        Cookies.set("aiiq_admin_panel_session", key, {
          expires: 365,
        });
        handleTokenSave(item.token, item.email, backendUrl)
        setRoutes(item.allRoutes);
      }
    });
  }, []);
  return loading ? (
    <Loader />
  ) : (
    <PanelLayout
      url={backendUrl}
      allowedRoutes={routes}
      currentPage={currentPage}
    >
      {currentPage == "files" && (
        <Files backendUrl={backendUrl} routes={routes} />
      )}
      {currentPage == "configuration" && (
        <Configuration backendUrl={backendUrl} routes={routes} />
      )}
      {currentPage == "sessions" && (
        <Sessions backendUrl={backendUrl} routes={routes} />
      )}
      {currentPage == "appearance" && (
        <Appearance backendUrl={backendUrl} routes={routes} />
      )}
      {currentPage == "usermanagement" && (
        <User backendUrl={backendUrl} routes={routes} />
      )}
      {currentPage == "routemanagement" && (
        <Route backendUrl={backendUrl} routes={routes} />
      )}
    </PanelLayout>
  );
}
