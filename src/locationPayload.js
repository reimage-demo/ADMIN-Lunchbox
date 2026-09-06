// Only send fields accepted by truckLocations.saveCurrent, never database metadata.
export function locationPayload(form) {
  return {
    locationName: form.locationName.trim(),
    address: form.address.trim(),
    locationNotes: form.locationNotes.trim() || undefined,
    latitude: form.latitude === "" ? undefined : Number(form.latitude),
    longitude: form.longitude === "" ? undefined : Number(form.longitude),
    serviceDate: form.serviceDate,
    startTime: form.startTime,
    endTime: form.endTime,
    status: form.status,
    orderingOpen: form.orderingOpen,
    schedulingEnabled: form.schedulingEnabled,
    prepTimeMinutes: Number(form.prepTimeMinutes),
    doorDashUrl: form.doorDashUrl.trim() || undefined,
    uberEatsUrl: form.uberEatsUrl.trim() || undefined,
    confirmLocation: true,
  };
}

export function locationError(error, fallback) {
  const detail = typeof error?.data === "string" ? error.data : error?.data?.message;
  return detail || fallback;
}
