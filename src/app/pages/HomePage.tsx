import { useAuth } from "@/authentication/contexts/Auth/useAuth";

const HomePage = () => {
  const authContext = useAuth();
  console.log(authContext?.accessToken);
  console.log(authContext?.user);

  return (
    <div className="flex min-h-screen flex-col justify-center">
      <div className="text-center">Hello World</div>
    </div>
  );
};
export default HomePage;
