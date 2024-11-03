import { Inter } from "next/font/google";
import "./globals.css";
import { Providers, } from './providers'
import RoleContextProvider from "@/store/context/RoleContext";
import EmailContextProvider from "@/store/context/EmailContext";
import { Suspense } from "react";
import Loader from "../../loading";
import UserContextProvider from "@/store/context/UserContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AIIQ Engine",
  description: "AIIQ Engine",
};

export default function RootLayout({ children }) {
  return (
    
     <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={<Loader />}>
          <Providers>
            <RoleContextProvider>
              <EmailContextProvider>
                <UserContextProvider>
                {children}
                </UserContextProvider>
              </EmailContextProvider>
            </RoleContextProvider>
          </Providers>
        </Suspense>
      </body>
    </html>
    
   
  );
}
