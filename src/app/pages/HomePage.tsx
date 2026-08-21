import { useAuth } from "@/authentication/contexts/Auth/useAuth";

const HomePage = () => {
  const auth = useAuth();
  console.log(auth?.accessToken);
  console.log(auth?.user);

  return (
    <div className="flex min-h-screen flex-col justify-center">
      <div className="text-center">Hello World</div>
    </div>
  );
};
export default HomePage;
