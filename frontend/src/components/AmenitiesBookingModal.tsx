// src/components/AmenititesBookingModal.jsx
import React, { useState, useEffect } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonLoading,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonTextarea,
  IonChip,
} from "@ionic/react";
import { timeOutline, homeOutline } from "ionicons/icons";
import api from "../api";

export default function AmenitiesBookingModal({
  isOpen,
  onClose,
  onConfirm,
  buildingId,
}) {
  const [step, setStep] = useState(1);
  const [amenities, setAmenities] = useState([]);
  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load amenities when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAmenities();
      resetForm();
    }
  }, [isOpen]);

  const loadAmenities = async () => {
    setLoading(true);
    try {
      const response = await api.get("/amenities");
      if (response.success) {
        setAmenities(response.amenities);
      }
    } catch (error) {
      console.error("Failed to load amenities:", error);
      setError("Failed to load amenities");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDates = async (amenityId) => {
    setLoading(true);
    try {
      const response = await api.get(`/amenities/${amenityId}/available`);
      if (response.success) {
        setAvailableDates(response.available_dates);
        setSelectedAmenity(response.amenity);
      }
    } catch (error) {
      console.error("Failed to load dates:", error);
      setError("Failed to check availability");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedAmenity(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setPurpose("");
    setError("");
    setAvailableDates([]);
  };

  const handleAmenitySelect = (amenity) => {
    setSelectedAmenity(amenity);
    loadAvailableDates(amenity.id);
    setStep(2);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep(3);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setStep(4);
  };

  const handleSubmit = async () => {
    console.log("✅ handleSubmit called");
    console.log("Selected Amenity:", selectedAmenity);
    console.log("Selected Date:", selectedDate);
    console.log("Selected Slot:", selectedSlot);
    console.log("Building ID from props:", buildingId);
    console.log("Purpose:", purpose);

    if (!selectedAmenity || !selectedDate || !selectedSlot) {
      setError("Please complete all steps");
      console.log("❌ Missing required fields");
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        amenity_id: selectedAmenity.id,
        date: selectedDate.date,
        slot_name: selectedSlot.name,
        purpose: purpose,
      };

      console.log("📤 Sending booking data:", bookingData);

      if (onConfirm) {
        console.log("📞 Calling onConfirm callback...");
        const success = await onConfirm(bookingData);
        console.log("✅ onConfirm returned:", success);

        if (success) {
          console.log("🎉 Success! Resetting form...");
          resetForm();
          onClose();
        } else {
          console.log("❌ onConfirm returned false");
        }
      } else {
        console.log("❌ onConfirm callback is undefined!");
        setError("Booking submission failed");
      }
    } catch (error) {
      console.error("🔥 Booking error:", error);
      setError(error.message || "Failed to submit booking");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderStepIndicator = () => (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          position: "relative",
          marginBottom: 8,
        }}
      >
        {[1, 2, 3, 4].map((stepNum) => (
          <div key={stepNum} style={{ textAlign: "center", zIndex: 2 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: step >= stepNum ? "#3880ff" : "#e0e0e0",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                margin: "0 auto 4px",
              }}
            >
              {stepNum}
            </div>
            <div
              style={{
                fontSize: 11,
                color: step >= stepNum ? "#3880ff" : "#666",
              }}
            >
              {stepNum === 1 && "Amenity"}
              {stepNum === 2 && "Date"}
              {stepNum === 3 && "Time"}
              {stepNum === 4 && "Details"}
            </div>
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            top: 15,
            left: 30,
            right: 30,
            height: 2,
            background: "#e0e0e0",
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={() => {
        resetForm();
        onClose();
      }}
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {step === 1 && "Select Amenity"}
            {step === 2 && "Select Date"}
            {step === 3 && "Select Time"}
            {step === 4 && "Booking Details"}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonLoading isOpen={loading} message="Loading..." />

        {renderStepIndicator()}

        {error && (
          <div
            style={{
              padding: 12,
              marginBottom: 16,
              background: "#fff5f5",
              border: "1px solid #fed7d7",
              borderRadius: 8,
              color: "#c53030",
            }}
          >
            {error}
          </div>
        )}

        {/* Step 1: Select Amenity */}
        {step === 1 && (
          <div>
            <h3 style={{ marginBottom: 16 }}>Choose Amenity to Book</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {amenities.map((amenity) => (
                <div
                  key={amenity.id}
                  onClick={() => handleAmenitySelect(amenity)}
                  style={{
                    padding: 16,
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    background: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: amenity.color || "#3880ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <IonIcon
                      icon={amenity.icon || homeOutline}
                      style={{ fontSize: 20 }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", fontSize: 16 }}>
                      {amenity.name}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 13 }}>
                      {amenity.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Date */}
        {step === 2 && selectedAmenity && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3880ff",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  fontSize: 14,
                  padding: 0,
                  marginBottom: 8,
                }}
              >
                ← Back to amenities
              </button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: selectedAmenity.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                >
                  <IonIcon icon={selectedAmenity.icon || homeOutline} />
                </div>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: 16 }}>
                    {selectedAmenity.name}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>
                    {selectedAmenity.description}
                  </div>
                </div>
              </div>
            </div>

            <h4 style={{ marginBottom: 12 }}>Select Date</h4>
            {availableDates.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: 40, color: "#64748b" }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
                <div style={{ fontWeight: 600 }}>No available dates</div>
                <div style={{ fontSize: 14 }}>Please try another amenity</div>
              </div>
            ) : (
              <IonGrid style={{ padding: 0 }}>
                <IonRow>
                  {availableDates.map((date) => (
                    <IonCol size="6" key={date.date}>
                      <div
                        onClick={() => handleDateSelect(date)}
                        style={{
                          padding: 12,
                          marginBottom: 8,
                          border: `2px solid ${
                            selectedDate?.date === date.date
                              ? "#3880ff"
                              : "#e2e8f0"
                          }`,
                          borderRadius: 10,
                          background:
                            selectedDate?.date === date.date
                              ? "#ebf8ff"
                              : "white",
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontWeight: "bold", fontSize: 18 }}>
                          {date.day}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {date.weekday}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>
                          {date.month}
                        </div>
                      </div>
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            )}
          </div>
        )}

        {/* Step 3: Select Time Slot */}
        {step === 3 && selectedDate && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3880ff",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  fontSize: 14,
                  padding: 0,
                  marginBottom: 8,
                }}
              >
                ← Back to dates
              </button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: selectedAmenity.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                >
                  <IonIcon icon={selectedAmenity.icon || homeOutline} />
                </div>
                <div>
                  <div style={{ fontWeight: "bold" }}>
                    {selectedAmenity.name}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    {selectedDate.weekday}, {selectedDate.month}{" "}
                    {selectedDate.day}
                  </div>
                </div>
              </div>
            </div>

            <h4 style={{ marginBottom: 12 }}>Available Time Slots</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {selectedDate.available_slots.map((slot) => (
                <div
                  key={slot.name}
                  onClick={() => handleSlotSelect(slot)}
                  style={{
                    padding: 16,
                    border: `2px solid ${
                      selectedSlot?.name === slot.name ? "#3880ff" : "#e2e8f0"
                    }`,
                    borderRadius: 12,
                    background:
                      selectedSlot?.name === slot.name ? "#ebf8ff" : "white",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: 16 }}>
                        {slot.name}
                      </div>
                      <div
                        style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}
                      >
                        <IonIcon
                          icon={timeOutline}
                          style={{ marginRight: 4 }}
                        />
                        {formatTime(slot.start_time)} -{" "}
                        {formatTime(slot.end_time)}
                      </div>
                    </div>
                    <IonChip
                      color={slot.is_full ? "danger" : "success"}
                      style={{ height: 24 }}
                    >
                      {slot.booked_count}/{slot.max_per_day}
                    </IonChip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Booking Details */}
        {step === 4 && selectedSlot && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setStep(3)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3880ff",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  fontSize: 14,
                  padding: 0,
                  marginBottom: 8,
                }}
              >
                ← Back to time slots
              </button>
            </div>

            <h3 style={{ marginBottom: 16 }}>Booking Summary</h3>

            {/* Summary Card */}
            <div
              style={{
                padding: 16,
                background: "#f8fafc",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: selectedAmenity.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                >
                  <IonIcon icon={selectedAmenity.icon || homeOutline} />
                </div>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: 16 }}>
                    {selectedAmenity.name}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>
                    {selectedDate.weekday}, {selectedDate.month}{" "}
                    {selectedDate.day}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  fontSize: 14,
                  paddingTop: 12,
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>
                    Time Slot
                  </div>
                  <div style={{ fontWeight: "500" }}>
                    {formatTime(selectedSlot.start_time)} -{" "}
                    {formatTime(selectedSlot.end_time)}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>
                    Slot Type
                  </div>
                  <div style={{ fontWeight: "500" }}>{selectedSlot.name}</div>
                </div>
              </div>
            </div>

            {/* Purpose Input */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: "600", marginBottom: 8, fontSize: 14 }}>
                Purpose (Optional)
              </div>
              <IonTextarea
                value={purpose}
                onIonChange={(e) => setPurpose(e.detail.value)}
                rows={3}
                placeholder="What is this booking for? (e.g., Birthday party, Family gathering)"
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  background: "white",
                }}
              />
            </div>

            {/* Notes */}
            <div
              style={{
                padding: 12,
                background: "#f0f9ff",
                borderRadius: 8,
                border: "1px solid #bae6fd",
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 12, color: "#0369a1" }}>
                <strong>Note:</strong> This booking requires admin approval. You
                will be notified once approved or rejected.
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ marginTop: 20 }}>
          {step === 4 ? (
            <IonButton
              expand="block"
              onClick={handleSubmit}
              disabled={loading}
              style={{ marginBottom: 8 }}
            >
              {loading ? "Submitting..." : "Submit Booking Request"}
            </IonButton>
          ) : (
            step > 1 && (
              <IonButton
                expand="block"
                color="medium"
                fill="outline"
                onClick={() => setStep(step - 1)}
                disabled={loading}
              >
                Back
              </IonButton>
            )
          )}

          <IonButton
            expand="block"
            color="medium"
            fill="outline"
            onClick={() => {
              resetForm();
              onClose();
            }}
            style={{ marginTop: 8 }}
          >
            Cancel
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
}
