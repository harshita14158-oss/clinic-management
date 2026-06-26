import { Suspense } from "react";
import { ClinicProfileEntry } from "@/components/clinic-profile-entry";

export default function ClinicProfilePage() {
  return (
    <Suspense fallback={null}>
      <ClinicProfileEntry />
    </Suspense>
  );
}
