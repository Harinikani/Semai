"use client";
import { useState, useEffect, useId, useRef } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { getAnimalAvatarWithFallback } from "@/lib/avatar";
import { set } from "date-fns";

export const CardStack = ({
  items,
  offset,
  scaleFactor,
  onCardChange
}) => {
  const CARD_OFFSET = offset || 10;
  const SCALE_FACTOR = scaleFactor || 0.06;
  const [cards, setCards] = useState(items);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [active, setActive] = useState(null);
  const ref = useRef(null);
  const contentRef = useRef(null);
  const id = useId();

  useEffect(() => {
    if (onCardChange) {
      onCardChange(currentIndex);
    }
  }, [currentIndex, onCardChange]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setActive(null);
      }
    }

    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  const goToNext = (from) => {
    setCards((prevCards) => {
      const newArray = [...prevCards];
      const item = newArray.splice(from, 1)[0];
      newArray.push(item);
      return newArray;
    });
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const goToPrevious = (from) => {
    setCards((prevCards) => {
      const newArray = [...prevCards];
      const item = newArray.pop();
      newArray.unshift(item);
      return newArray;
    });
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 h-full w-full z-[60]"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 grid place-items-start z-[100] pt-16 md:pt-0 md:place-items-center">
            <motion.div
              layoutId={`card-${active.id}-${id}`}
              ref={ref}
              className="w-full max-w-[430px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden relative"
            >
              {/* Close Button */}
              <motion.button
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.05 } }}
                className="flex absolute top-4 right-4 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full h-8 w-8 z-10 shadow-lg border border-gray-200"
                onClick={() => setActive(null)}
              >
                <CloseIcon />
              </motion.button>

              <motion.div layoutId={`image-${active.id}-${id}`}>
                <img
                  src={getAnimalAvatarWithFallback(active.image, active.name)}
                  alt={active.name}
                  className="w-full h-64 object-cover object-top bg-gradient-to-br from-emerald-100 to-teal-100"
                />
              </motion.div>

              <div className="flex flex-col flex-1 min-h-0 pb-24">
                <div className="p-6 flex-shrink-0">
                  <div className="mb-4">
                    <motion.h3
                      layoutId={`name-${active.id}-${id}`}
                      className="text-2xl font-bold text-neutral-800 dark:text-neutral-200"
                    >
                      {active.name}
                    </motion.h3>
                    {active.designation && (
                      <motion.p
                        layoutId={`designation-${active.id}-${id}`}
                        className="text-neutral-600 dark:text-neutral-400 mt-1"
                      >
                        {active.designation}
                      </motion.p>
                    )}
                  </div>

                  {/* Badges for quick info */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-wrap gap-2 mb-4"
                  >
                    {active.species && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                        {active.species}
                      </span>
                    )}
                    {active.endangerStatus && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        active.endangerStatus === 'Critically Endangered' ? 'bg-red-100 text-red-700 border-red-200' :
                        active.endangerStatus === 'Endangered' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        active.endangerStatus === 'Vulnerable' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-green-100 text-green-700 border-green-200'
                      }`}>
                        {active.endangerStatus}
                      </span>
                    )}
                    {active.groupName && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                        {active.groupName}
                      </span>
                    )}
                  </motion.div>
                </div>

                {/* Scrollable Content Area */}
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  ref={contentRef}
                  className="flex-1 overflow-y-auto px-6 pb-6"
                  style={{
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  <div className="space-y-4">
                    {active.content && (
                      <div>
                        <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed">
                          {active.content}
                        </p>
                      </div>
                    )}

                    {active.diet && (
                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
                          Diet
                        </h4>
                        <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed">
                          {active.diet}
                        </p>
                      </div>
                    )}

                    {active.habitat && (
                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
                          Habitat
                        </h4>
                        <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed">
                          {active.habitat}
                        </p>
                      </div>
                    )}

                    {active.funFact && (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                        <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1">
                          Fun Fact
                        </h4>
                        <p className="text-emerald-900 dark:text-emerald-200 text-sm leading-relaxed">
                          {active.funFact}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <div className="relative h-72 sm:h-80 w-full flex items-center justify-center">
        {cards.map((card, index) => {
          return (
            <Card
              key={card.id}
              card={card}
              index={index}
              goToNext={goToNext}
              goToPrevious={goToPrevious}
              cardOffset={CARD_OFFSET}
              scaleFactor={SCALE_FACTOR}
              cardsLength={cards.length}
              onExpand={setActive}
              layoutId={`card-${card.id}-${id}`}
            />
          );
        })}
      </div>
    </>
  );
};

const Card = ({ card, index, goToPrevious, goToNext, cardOffset, scaleFactor, cardsLength, onExpand, layoutId }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (_, info) => {
    setIsDragging(false);
    // Swipe left - go to previous card
    if (info.offset.x < -100) {
      goToPrevious();
    }
    // Swipe right - go to next card
    else if (info.offset.x > 100) {
      goToNext();
    }
  };

  const handleClick = () => {
    if (!isDragging && index === 0) {
      onExpand(card);
    }
  };

return (
    <motion.div
      layoutId={layoutId}
      className="absolute bg-white dark:bg-black h-[22rem] w-[22rem] sm:h-96 sm:w-96 rounded-3xl shadow-xl border border-emerald-200 dark:border-white/[0.1] shadow-black/[0.1] dark:shadow-white/[0.05] flex flex-col cursor-grab active:cursor-grabbing overflow-hidden"
      style={{
        transformOrigin: "center center",
        x,
        rotate,
        opacity,
      }}
      animate={{
        top: index * -cardOffset,
        scale: 1 - index * scaleFactor,
        zIndex: cardsLength - index,
      }}
      drag={index === 0 ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      whileDrag={{ scale: 1.05 }}
    >
      {/* Avatar */}
      <div className="-mx-px -m-px">
        <img
          src={getAnimalAvatarWithFallback(card.image, card.name)}
          alt={card.name}
          className="w-full h-64 object-cover bg-gradient-to-br from-emerald-100 to-teal-100"
        />
        {/* <div className="flex-1">
          <p className="text-neutral-800 font-bold dark:text-white text-lg">
            {card.name}
          </p>
          <p className="text-neutral-500 font-normal dark:text-neutral-300 text-sm">
            {card.designation}
          </p>
        </div> */}
      </div>

      <div className="p-4 font-normal text-neutral-700 dark:text-neutral-200 text-sm flex-1 flex items-center justify-center">
        {card.content}
      </div>
    </motion.div>
  );
};

const CloseIcon = () => {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-black"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};