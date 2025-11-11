export const dynamic = "force-dynamic";
export const revalidate = 0;

import VerifyEmailStartClient from "./VerifyEmailStartClient";

export default function Page({ searchParams }: { searchParams: { email?: string } }) {
  const email = searchParams?.email ?? "";
  return <VerifyEmailStartClient email={email} />;
}
