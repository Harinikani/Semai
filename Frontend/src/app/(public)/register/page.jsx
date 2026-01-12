"use client";

import { useState, useMemo } from "react";
import InputBox from '../../components/InputBox';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/Breadcrumb";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function RegistrationForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPrivacySheetOpen, setIsPrivacySheetOpen] = useState(false);
  const router = useRouter();

  // simple validators
  const isEmailLike = (v) => /\S+@\S+\.\S+/.test(v);
  const isPhoneOk = (v) => {
    if (!v || v.trim() === "") return true;
    const cleaned = v.replace(/\D/g, '');
    return cleaned.length >= 8;
  };

  const canSubmit = useMemo(() => {
    const hasEmail = email.trim().length > 0 && isEmailLike(email);
    const passOk = password.length >= 6 && password === confirm;
    const phoneOk = isPhoneOk(phone);
    const hasFirstName = firstName.trim().length > 0;
    const hasLastName = lastName.trim().length > 0;
    const hasAgreed = agree;
    
    return hasEmail && passOk && phoneOk && hasFirstName && hasLastName && hasAgreed;
  }, [email, password, confirm, phone, agree, firstName, lastName]);

  const formatDateForBackend = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setErrors({});

    try {
      const payload = {
        email: email,
        password: password,
        first_name: firstName,
        last_name: lastName,
        phone_number: phone || null,
        date_of_birth: dateOfBirth ? formatDateForBackend(dateOfBirth) : null
      };

      console.log("📤 Sending registration request:", payload);

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("📥 Response status:", res.status, res.statusText);
      
      let data = {};
      try {
        const responseText = await res.text();
        console.log("📥 Raw response text:", responseText);
        
        if (responseText) {
          data = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error("❌ Failed to parse response:", parseError);
      }

      if (res.ok) {
        console.log("✅ Registration successful - Response data:", data);
        
        if (data.id) {
          localStorage.setItem('current_user_id', data.id);
          localStorage.setItem('user_data', JSON.stringify(data));
          alert("Registration successful! Please login with your credentials.");
          router.push('/login');
        } else {
          console.warn("⚠️ Registration response missing user ID:", data);
          setErrors({ submit: "Registration completed but missing user data. Please try logging in." });
          router.push('/login');
        }
      } else {
        console.error("❌ Registration failed. Status:", res.status, "Data:", data);
        
        // Handle different error scenarios
        if (res.status === 500) {
          setErrors({ submit: "Server error. Please check your backend logs." });
        } else if (data.detail) {
          setErrors({ submit: data.detail });
        } else if (res.status === 422) {
          setErrors({ submit: "Validation error. Please check all fields are correct." });
        } else {
          setErrors({ submit: `Registration failed (Status: ${res.status}). Please try again.` });
        }
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      setErrors({ submit: `Network error: ${error.message}. Check if backend is running.` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-6">
      <div className="max-w-md mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/login">Log In</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Registration</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-3 text-center">
          <h1 className="text-2xl font-bold text-emerald-700 mt-4">
            Account Registration
          </h1>
          <p className="mt-2 text-sm text-emerald-600">
            Please enter the following information.
          </p>
        </div>

        {errors.submit && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4">
          <InputBox
            label="First Name"
            type="text"
            value={firstName}
            onChange={setFirstName}
            placeholder="Enter your first name"
            required
          />

          <InputBox
            label="Last Name"
            type="text"
            value={lastName}
            onChange={setLastName}
            placeholder="Enter your last name"
            required
          />

          <InputBox
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="Enter your email"
            required
          />

          <InputBox
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter Password (min 6 characters)"
            required
          />

          <InputBox
            label="Confirm Password"
            type="password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Confirm your password"
            required
          />

          <InputBox
            label="Contact Number (Optional)"
            type="tel"
            value={phone}
            onChange={setPhone}
            placeholder="Enter Phone Number"
          />

          <InputBox
            label="Date of Birth (Optional)"
            type="date"
            value={dateOfBirth}
            onChange={setDateOfBirth}
          />

          <label className="flex items-start gap-3 mt-4 select-none">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span className="text-sm text-gray-700">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setIsPrivacySheetOpen(true)}
                className="text-blue-600 hover:text-blue-800 underline transition-colors"
              >
                Privacy Policy
              </button>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className={`w-full mt-6 rounded-2xl py-3 text-base font-semibold transition 
              ${canSubmit && !isLoading ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
          >
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* Privacy Policy Sheet */}
        <Sheet open={isPrivacySheetOpen} onOpenChange={setIsPrivacySheetOpen}>
      <SheetContent 
        side="bottom"
        className="p-0 bg-white border border-gray-200 max-w-[430px] mx-auto h-auto max-h-[85vh]"
      >
        {/* Internal container to structure Header, Scrollable Content, and Footer */}
        <div className="flex flex-col h-auto p-6 max-w-[430px] mx-auto w-full bg-white"> 
          
          <SheetHeader className="text-left border-b border-gray-200 pb-4 mb-4">
            <SheetTitle className="text-emerald-700 text-2xl font-bold">Privacy Policy</SheetTitle>
            <SheetDescription className="text-emerald-600">
              Last updated: {new Date().toLocaleDateString()}
            </SheetDescription>
          </SheetHeader>
          
          {/* Main content area with constrained height and scrolling */}
          <div className="py-2 flex-grow overflow-y-auto bg-white text-gray-700 rounded-lg max-h-[50vh]">
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-2">
                  1. Information We Collect
                </h3>
                <p className="text-sm leading-relaxed">
                  We collect information you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside mt-2 text-sm space-y-1 leading-relaxed">
                  <li>Personal information (name, email, phone number)</li>
                  <li>Account credentials</li>
                  <li>Profile information</li>
                  <li>Communication preferences</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">
                  2. How We Use Your Information
                </h3>
                <p className="text-sm leading-relaxed">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside mt-2 text-sm space-y-1 leading-relaxed">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Personalize your experience</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">
                  3. Information Sharing
                </h3>
                <p className="text-sm leading-relaxed">
                  We do not sell, trade, or otherwise transfer your personally
                  identifiable information to outside parties except as
                  described in this policy.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">
                  4. Data Security
                </h3>
                <p className="text-sm leading-relaxed">
                  We implement appropriate technical and organizational security
                  measures to protect your personal information against
                  unauthorized access, alteration, disclosure, or destruction.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">5. Your Rights</h3>
                <p className="text-sm leading-relaxed">
                  You have the right to access, correct, or delete your personal
                  information. You may also have the right to restrict or object
                  to certain processing activities and to data portability.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">6. Contact Us</h3>
                <p className="text-sm leading-relaxed">
                  If you have any questions about this Privacy Policy, please
                  contact us at privacy@yourapp.com.
                </p>
              </section>

              <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 leading-relaxed">
                  By checking the agreement box, you acknowledge that you have
                  read, understood, and agree to be bound by this Privacy
                  Policy.
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <SheetFooter className="mt-4 pt-4 border-t border-gray-200">
            <SheetClose asChild>
              <button className="w-full px-4 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors shadow-sm">
                Close
              </button>
            </SheetClose>
          </SheetFooter>
          
        </div>
      </SheetContent>
    </Sheet>
      </div>
    </div>
  );
}
