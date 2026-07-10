import { useState } from "react";


import { Button } from "../components/Button";
import { links } from "../constants";

export const About = () => {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(links.contactEmail);

    setHasCopied(true);

    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };

  return (
    <section className="c-space my-20" id="about">
      <div className="grid h-full grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 xl:grid-rows-6">
        <div className="col-span-1 xl:row-span-3">
          <div className="grid-container">
            <img
              src="/assets/grid1_new.jpg"
              alt="Grid 1"
              className="h-fit w-full object-cover sm:h-[276px] rounded-3xl"
            />

            <div>
              <p className="grid-headtext">Hi, I&apos;m Minh Ngọc</p>
              <p className="grid-subtext">
                Math and IT teacher, research assitant of HCMUE - faculty of information technology, spend 4 year research about deeplearning - computer vision.
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-1 xl:row-span-3">
          <div className="grid-container">
            <img
              src="/assets/grid2_new.png"
              alt="Grid 2"
              className="h-fit w-full object-contain sm:w-[276px]"
            />

            <div>
              <p className="grid-headtext">Tech Stack</p>
              <p className="grid-subtext">
                I specialize in AI, Google Colab, and Web development.
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-1 xl:row-span-4">
          <div className="grid-container">
            <div className="flex h-fit w-full items-center justify-center rounded-3xl sm:h-[326px]">
              <img
                src="/assets/globe_replacement.png"
                alt="Replacement Image"
                className="h-full w-full object-cover rounded-3xl"
              />
            </div>

            <div>
              <p className="grid-headtext">
                I have work for experiment highschool and teaching at home, FIT of HCMUE
              </p>

              <p className="grid-subtext">
                I&apos;m based in Ho Chi Minh City, Vietnam.
              </p>

              <Button onClick={() => window.dispatchEvent(new Event('open-contact'))} containerClass="w-full mt-10" isBeam>
                Contact Me
              </Button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 xl:row-span-3">
          <div className="grid-container">
            <img
              src="/assets/grid3.png"
              alt="Grid 3"
              className="h-fit w-full object-contain sm:h-[266px]"
            />

            <div>
              <p className="grid-headtext">My Passion for Coding</p>
              <p className="grid-subtext">
                I love solving problems and building things through code. Coding
                isn&apos;t just my profession - it is my passion.
              </p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-1 xl:row-span-2">
          <div className="grid-container">
            <img
              src="/assets/grid4.png"
              alt="Grid 4"
              className="h-fit w-full object-cover sm:h-[276px] sm:object-top md:h-[126px]"
            />

            <div className="space-y-2">
              <p className="grid-subtext text-center">
                Contact me through email
              </p>

              <div className="copy-container">
                <Button onClick={handleCopy} containerClass="w-full">
                  <img
                    src={hasCopied ? "/assets/tick.svg" : "/assets/copy.svg"}
                    alt={hasCopied ? "Check" : "Copy"}
                    className="size-5"
                  />
                  {hasCopied ? "Copied to clipboard" : "Copy Email"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
