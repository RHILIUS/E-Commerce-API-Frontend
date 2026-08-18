import { useEffect } from "react";

import { login } from "@/authentication/api";

const HomePage = () => {
  useEffect(() => {
    const fetch = async () => {
      const { access } = await login("rhian@gmail.com", "rhian123");
      console.log(access);
    };

    fetch();
  }, []);
  return (
    <div className="flex min-h-screen flex-col justify-center">
      <div className="text-center">Hello World</div>
    </div>
  );
};
export default HomePage;
