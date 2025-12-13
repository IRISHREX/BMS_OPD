import React, { useContext, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { toast } from "react-toastify";
import { Context } from "../main";
import {
  LOGIN_LOGO_WIDTH,
  LOGIN_LOGO_BORDER_RADIUS,
  LOGIN_FORM_MARGIN,
  LOGIN_RADIO_LABEL_MARGIN_RIGHT,
  LOGIN_RADIO_LABEL_MARGIN_LEFT,
  LOGIN_BUTTON_BORDER,
  LOGIN_BUTTON_BORDER_RADIUS,
} from "../utils/constants";
import { loginRequest } from "../store/authSlice";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Admin");

  const { isAuthenticated, setIsAuthenticated } = useContext(Context);
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);

  const navigateTo = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    // dispatch redux login
    dispatch(loginRequest({ email, password, role }));
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      setIsAuthenticated(true);
      navigateTo('/');
    }
    if (auth.error) {
      toast.error(auth.error);
    }
  }, [auth.isAuthenticated, auth.error]);

  if (isAuthenticated || auth.isAuthenticated) {
    return <Navigate to={"/"} />;
  }

  return (
    <>
      <section className="container form-component">
        <img src="/logo.svg" alt="logo" className="logo" style={{ width: `${LOGIN_LOGO_WIDTH}px`, borderRadius: LOGIN_LOGO_BORDER_RADIUS}} />
        <h1 className="form-title">WELCOME TO BIOMECASOFT</h1>
        <p>Dashboard access for Admins and Doctors. Choose role then login.</p>
        {auth.loading ? <div className="loader" style={{Height:"3rem"}}></div> : (
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {/* <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            /> */}
            <div style={{ margin: LOGIN_FORM_MARGIN }}>
              <label style={{ marginRight: LOGIN_RADIO_LABEL_MARGIN_RIGHT }}>
                <input type="radio" name="role" value="Admin" checked={role === 'Admin'} onChange={() => setRole('Admin')} /> Admin
              </label>
              <label>
                <input type="radio" name="role" value="Doctor" checked={role === 'Doctor'} onChange={() => setRole('Doctor')} /> Doctor
              </label>
              <label style={{ marginLeft: LOGIN_RADIO_LABEL_MARGIN_LEFT }}>
                <input type="radio" name="role" value="Compounder" checked={role === 'Compounder'} onChange={() => setRole('Compounder')} /> Assistant
              </label>
            </div>
            <div style={{ justifyContent: "center", alignItems: "center" }}>
              <button type="submit" style={{border: LOGIN_BUTTON_BORDER, borderRadius: LOGIN_BUTTON_BORDER_RADIUS}}>Login</button>
            </div>
            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <p>
                Forgot your password?{" "}
                <span
                  onClick={() => navigateTo('/forgotten-password')}
                  style={{
                    color: "#007bff",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Click here
                </span>
              </p>
            </div>
          </form>
        )}
      </section>
    </>
  );
};

export default Login;
