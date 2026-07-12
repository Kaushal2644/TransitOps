import { getIO } from "../socket/index.js";

export const SOCKET_EVENTS = {
  DASHBOARD_UPDATE: "dashboard:update",
  VEHICLE_UPDATE: "vehicle:update",
  DRIVER_UPDATE: "driver:update",
  TRIP_UPDATE: "trip:update",
  MAINTENANCE_UPDATE: "maintenance:update",
  FUEL_UPDATE: "fuel:update",
  EXPENSE_UPDATE: "expense:update",
};

export const emitSocketEvent = (event, payload = {}) => {
  try {
    const io = getIO();
    if (io) io.emit(event, payload);
  } catch {
    // Non-blocking — socket failures must not break API responses
  }
};

export const emitTripRelated = () => {
  emitSocketEvent(SOCKET_EVENTS.TRIP_UPDATE);
  emitSocketEvent(SOCKET_EVENTS.DASHBOARD_UPDATE);
  emitSocketEvent(SOCKET_EVENTS.VEHICLE_UPDATE);
  emitSocketEvent(SOCKET_EVENTS.DRIVER_UPDATE);
};

export const emitVehicleRelated = () => {
  emitSocketEvent(SOCKET_EVENTS.VEHICLE_UPDATE);
  emitSocketEvent(SOCKET_EVENTS.DASHBOARD_UPDATE);
};

export const emitDriverRelated = () => {
  emitSocketEvent(SOCKET_EVENTS.DRIVER_UPDATE);
  emitSocketEvent(SOCKET_EVENTS.DASHBOARD_UPDATE);
};

export const emitMaintenanceRelated = () => {
  emitSocketEvent(SOCKET_EVENTS.MAINTENANCE_UPDATE);
  emitSocketEvent(SOCKET_EVENTS.VEHICLE_UPDATE);
  emitSocketEvent(SOCKET_EVENTS.DASHBOARD_UPDATE);
};

export const emitFuelRelated = () => {
  emitSocketEvent(SOCKET_EVENTS.FUEL_UPDATE);
  emitSocketEvent(SOCKET_EVENTS.DASHBOARD_UPDATE);
};

export const emitExpenseRelated = () => {
  emitSocketEvent(SOCKET_EVENTS.EXPENSE_UPDATE);
  emitSocketEvent(SOCKET_EVENTS.DASHBOARD_UPDATE);
};
