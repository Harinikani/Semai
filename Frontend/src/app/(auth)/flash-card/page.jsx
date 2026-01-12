"use client";

import { useState, useEffect } from "react";
import { CardStack } from "@/components/ui/card-stack";
import { useRouter } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../components/Breadcrumb';

export default function LearnPage() {
    const router = useRouter();
    const [currentCard, setCurrentCard] = useState(0);
    const [displayedCards, setDisplayedCards] = useState([]);

    const allEducationalCards = [
        {
            id: 1,
            name: "Sea Turtle",
            designation: "Marine Reptile",
            content: "This animal always swim back to the same beach where they were born to lay their eggs! This incredible navigation ability helps them survive.",
            species: "Cheloniidae",
            scientificName: "Chelonia mydas",
            endangerStatus: "Endangered",
            groupName: "Chelonian",
            habitat: "Tropical and subtropical ocean waters, coral reefs, and coastal areas throughout the world's oceans",
            diet: "Omnivorous - jellyfish, seaweed, sea grasses, algae, and small invertebrates",
            funFact: "Sea turtles can hold their breath for up to 5 hours underwater and have been around for over 100 million years!",
            animalSound: "Sea turtles are mostly silent, but hatchlings may chirp softly",
            image: "https://inaturalist-open-data.s3.amazonaws.com/photos/160686955/original.jpg?w=400&h=400&fit=crop"
        },
        {
            id: 2,
            name: "Oriental Pied Hornbill",
            designation: "Forest Bird",
            content: "They are known as 'farmers of the forest' because they help disperse seeds. Their distinctive casque's size and function vary among species.",
            species: "Bucerotidae",
            scientificName: "Anthracoceros albirostris",
            endangerStatus: "Least Concern",
            groupName: "Aves",
            habitat: "Tropical and subtropical forests, forest edges, plantations, and even urban parks across Southeast Asia",
            diet: "Omnivorous - primarily fruits (especially figs), insects, small reptiles, and amphibians",
            funFact: "Female hornbills seal themselves inside tree cavities during nesting, relying entirely on the male to bring food through a narrow slit!",
            animalSound: "Distinctive cackling, chuckling, and high-pitched calls, often described as 'ka-ka-ka' or 'kek-kek-kek'",
            image:"https://cdn.download.ams.birds.cornell.edu/api/v1/asset/186466511/2400?w=400&h=400&fit=crop"
        },
        {
            id: 3,
            name: "Malayan Tiger",
            designation: "Apex Predator",
            content: "It is Malaysia's national animal and one of the smallest of its subspecies. Only about 150 individuals remain in the wild.",
            species: "Panthera tigris jacksoni",
            scientificName: "Panthera tigris jacksoni",
            endangerStatus: "Critically Endangered",
            groupName: "Felidae",
            habitat: "Tropical and subtropical moist broadleaf forests of Peninsular Malaysia",
            diet: "Carnivorous - deer, wild boar, tapirs, and smaller mammals like monkeys and birds",
            funFact: "Each tiger's stripe pattern is unique, like a human fingerprint - no two tigers have the same markings!",
            animalSound: "Powerful roars, growls, and chuffing sounds to communicate - can be heard up to 3 km away",
            image: "https://cassette.sphdigital.com.sg/image/straitstimes/c0eb66d94f4da2d4ff7d2d0cef03590889eae273f5dae5817bf8439364a96433?w=400&h=400&fit=crop"
        },
        {
            id: 4,
            name: "Orangutan",
            designation: "Great Ape",
            content: "One of our closest relatives, this animal shares 97% of its DNA with humans. They're found only in Borneo and Sumatra.",
            species: "Pongo pygmaeus",
            scientificName: "Pongo pygmaeus",
            endangerStatus: "Critically Endangered",
            groupName: "Hominidae",
            habitat: "Tropical rainforests of Borneo and Sumatra, spending most of their time in trees",
            diet: "Primarily frugivorous - wild fruits, leaves, bark, flowers, insects, and occasionally bird eggs",
            funFact: "Orangutans are incredibly intelligent and have been observed using tools like sticks to extract insects and honey!",
            animalSound: "Long calls, grunts, and kiss-squeaks - males produce loud 'long calls' that can last up to 2 minutes",
            image: "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-720x480/07/b7/26/52.jpg?w=400&h=400&fit=crop"
        },
        {
            id: 5,
            name: "Proboscis Monkey",
            designation: "Endemic Primate",
            content: "Famous for their large, distinctive noses, they are excellent swimmers and can be found only in Borneo.",
            species: "Nasalis larvatus",
            scientificName: "Nasalis larvatus",
            endangerStatus: "Endangered",
            groupName: "Cercopithecidae",
            habitat: "Mangrove forests, riverine forests, and coastal areas of Borneo",
            diet: "Herbivorous - leaves, seeds, unripe fruits, and occasionally flowers from mangrove trees",
            funFact: "Their large noses amplify their calls and attract females - the bigger the nose, the more attractive!",
            animalSound: "Honking sounds, alarm calls, and loud roars - males make distinctive honking noises",
            image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Proboscis_Monkey_in_Borneo.jpg/2880px-Proboscis_Monkey_in_Borneo.jpg?w=400&h=400&fit=crop"
        },
        {
            id: 6,
            name: "Asian Elephant",
            designation: "Megaherbivore",
            content: "Smaller than their African cousins and play a crucial role in maintaining forest ecosystems through seed dispersal.",
            species: "Elephas maximus",
            scientificName: "Elephas maximus",
            endangerStatus: "Endangered",
            groupName: "Elephantidae",
            habitat: "Tropical forests, grasslands, and scrublands across South and Southeast Asia",
            diet: "Herbivorous - grasses, leaves, bamboo, bark, roots, and fruits - consuming up to 150 kg daily",
            funFact: "Elephants have exceptional memory and can recognize up to 30 relatives by sight or smell!",
            animalSound: "Trumpeting, rumbling, and infrasonic calls - can communicate over distances up to 10 km",
            image: "https://upload.wikimedia.org/wikipedia/commons/9/98/Elephas_maximus_%28Bandipur%29.jpg?w=400&h=400&fit=crop"
        },
        {
            id: 7,
            name: "Malayan Tapir",
            designation: "Forest Herbivore",
            content: "With their distinctive black and white coloring, they look like a mix between a pig and an elephant but are actually related to horses and rhinos!",
            species: "Tapirus indicus",
            scientificName: "Tapirus indicus",
            endangerStatus: "Endangered",
            groupName: "Tapiridae",
            habitat: "Lowland tropical rainforests near water sources in Southeast Asia",
            diet: "Herbivorous - leaves, buds, shoots, fruits, and aquatic plants",
            funFact: "Baby tapirs have spots and stripes for camouflage, which fade as they grow into their unique black and white pattern!",
            animalSound: "High-pitched whistles and squeaks to communicate, especially between mothers and calves",
            image: "https://imgs.mongabay.com/wp-content/uploads/sites/20/2019/01/14064748/animals_00884-762x512.jpg?w=400&h=400&fit=crop"
        },
        {
            id: 8,
            name: "Bornean Pygmy Elephant",
            designation: "Smallest Elephant",
            content: "The smallest subspecies of its kind! Our friend here are found only in northern Borneo and are incredibly gentle.",
            species: "Elephas maximus borneensis",
            scientificName: "Elephas maximus borneensis",
            endangerStatus: "Endangered",
            groupName: "Elephantidae",
            habitat: "Lowland forests and floodplains of northern Borneo",
            diet: "Herbivorous - grasses, palms, wild bananas, and various forest vegetation",
            funFact: "Their tails are so long they sometimes drag on the ground, and their ears are larger relative to their body size!",
            animalSound: "Gentle trumpeting, rumbles, and low-frequency calls to communicate with the herd",
            image: "https://mspo.org.my/wp-content/uploads/2025/08/iStock-160736236_de8cb756.jpg?w=400&h=400&fit=crop"
        },
        {
            id: 9,
            name: "Rhinoceros Hornbill",
            designation: "Majestic Bird",
            content: "This beauty is one of the largest of its kind and plays a vital role in forest regeneration through seed dispersal.",
            species: "Buceros rhinoceros",
            scientificName: "Buceros rhinoceros",
            endangerStatus: "Vulnerable",
            groupName: "Bucerotidae",
            habitat: "Primary lowland and hill rainforests of Southeast Asia",
            diet: "Frugivorous - mainly fruits, especially figs, but also insects and small animals",
            funFact: "Their casque is hollow and may act as a resonating chamber to amplify their calls across the forest!",
            animalSound: "Loud, harsh calls that sound like 'tok-tok-tok' or deep, resonant honks",
            image: "https://cdn.download.ams.birds.cornell.edu/api/v1/asset/220489361/2400?w=400&h=400&fit=crop"
        },
        {
            id: 10,
            name: "Sun Bear",
            designation: "Smallest Bear",
            content: "This one is the smallest of its kind in the world and gets its name from the golden patch on its chest that resembles the rising sun.",
            species: "Helarctos malayanus",
            scientificName: "Helarctos malayanus",
            endangerStatus: "Vulnerable",
            groupName: "Ursidae",
            habitat: "Tropical rainforests of Southeast Asia",
            diet: "Omnivorous - honey, insects, fruits, small mammals, and bird eggs",
            funFact: "Sun bears have exceptionally long tongues (up to 25 cm) that help them extract honey from beehives!",
            animalSound: "Grunts, growls, and loud huffing sounds when threatened",
            image: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Sun-bear.jpg?w=400&h=400&fit=crop"
        },
        {
            id: 11,
            name: "Clouded Leopard",
            designation: "Tree Climber",
            content: "They are excellent climbers with the longest canine teeth relative to body size of any cat species.",
            species: "Neofelis nebulosa",
            scientificName: "Neofelis nebulosa",
            endangerStatus: "Vulnerable",
            groupName: "Felidae",
            habitat: "Forests and wooded areas across Southeast Asia",
            diet: "Carnivorous - deer, pigs, monkeys, squirrels, and birds",
            funFact: "They can rotate their ankles 180 degrees, allowing them to climb down trees headfirst like squirrels!",
            animalSound: "Purrs, meows, hisses, and low moaning calls",
            image: "https://a-z-animals.com/media/2022/09/shutterstock_740325778-1536x1205.jpg?w=400&h=400&fit=crop"
        },
        {
            id: 12,
            name: "Pangolin",
            designation: "Scaly Anteater",
            content: "The only mammals completely covered in scales, which are made of keratin - the same material as human fingernails!",
            species: "Manis javanica",
            scientificName: "Manis javanica",
            endangerStatus: "Critically Endangered",
            groupName: "Manidae",
            habitat: "Forests, grasslands, and plantations across Southeast Asia",
            diet: "Insectivorous - ants and termites exclusively",
            funFact: "When threatened, pangolins curl into a tight ball that even lions can't unroll!",
            animalSound: "Hissing and puffing sounds when threatened, otherwise mostly silent",
            image: "https://cdn.britannica.com/41/124241-050-9027A8EF/Pangolin.jpg?w=400&h=400&fit=crop"
        },
        {
            id: 13,
            name: "Slow Loris",
            designation: "Nocturnal Primate",
            content: "One of the few venomous mammals in the world, with a toxic bite that can cause anaphylactic shock in humans.",
            species: "Nycticebus coucang",
            scientificName: "Nycticebus coucang",
            endangerStatus: "Endangered",
            groupName: "Lorisidae",
            habitat: "Tropical rainforests, secondary forests, and bamboo groves",
            diet: "Omnivorous - fruits, tree gum, insects, and small animals",
            funFact: "They have a special comb-like tooth called a 'toothcomb' used for grooming!",
            animalSound: "Soft whistles, clicks, and high-pitched calls",
            image: "https://inaturalist-open-data.s3.amazonaws.com/photos/65558582/original.jpg?w=400&h=400&fit=crop"
        },
        {
            id: 14,
            name: "Mouse Deer",
            designation: "Smallest Hoofed Animal",
            content: "Also known as chevrotains, our friend here are the smallest hoofed mammals in the world and are neither mice nor deer!",
            species: "Tragulus kanchil",
            scientificName: "Tragulus kanchil",
            endangerStatus: "Least Concern",
            groupName: "Tragulidae",
            habitat: "Forests and shrublands across Southeast Asia",
            diet: "Herbivorous - leaves, fruits, shoots, and fungi",
            funFact: "They have tusk-like canine teeth, especially in males, which are used for fighting!",
            animalSound: "High-pitched squeaks and soft chattering sounds",
            image: "https://images2.minutemediacdn.com/image/upload/c_fill,w_2160,ar_16:9,f_auto,q_auto,g_auto/shape%2Fcover%2Fsport%2F64198-flickr-18177136963-7afb9a33c8-h-4b5d578091368f7beaeb6d090c96f53f.jpg?w=400&h=400&fit=crop"
        },
        {
            id: 15,
            name: "Great Argus Pheasant",
            designation: "Elaborate Dancer",
            content: "The males have incredibly elaborate courtship displays featuring intricate feather patterns.",
            species: "Argusianus argus",
            scientificName: "Argusianus argus",
            endangerStatus: "Vulnerable",
            groupName: "Phasianidae",
            habitat: "Lowland rainforests of Southeast Asia",
            diet: "Omnivorous - fruits, insects, snails, and small reptiles",
            funFact: "The male's secondary wing feathers have eye-spots that create a mesmerizing pattern during courtship displays!",
            animalSound: "Loud, piercing calls that echo through the forest - 'kow-wow'",
            image: "https://www.mandai.com/content/dam/mandai/bird-paradise/animals-zones/bird-paradise-animals/great-argus/the-argus-carousel1.jpg.transform/compress/resize1000/img.jpg?w=400&h=400&fit=crop"
        },
        {
            id: 16,
            name: "Binturong",
            designation: "Bearcat",
            content: "Also known as bearcats, they are not related to bears or cats but are actually part of the civet family.",
            species: "Arctictis binturong",
            scientificName: "Arctictis binturong",
            endangerStatus: "Vulnerable",
            groupName: "Viverridae",
            habitat: "Dense tropical rainforests of Southeast Asia",
            diet: "Omnivorous - fruits, leaves, shoots, insects, and small animals",
            funFact: "Binturongs smell like buttered popcorn due to a chemical compound in their urine!",
            animalSound: "Chuckles, grunts, and high-pitched wails",
            image: "https://upload.wikimedia.org/wikipedia/commons/a/a7/Binturong_in_Overloon.jpg?w=400&h=400&fit=crop"
        },
        {
            id: 17,
            name: "Rafflesia Flower",
            designation: "Corpse Flower",
            content: "The world's largest individual flower and is famous for its enormous size and foul odor.",
            species: "Rafflesia arnoldii",
            scientificName: "Rafflesia arnoldii",
            endangerStatus: "Endangered",
            groupName: "Rafflesiaceae",
            habitat: "Tropical rainforests of Southeast Asia, particularly Sumatra and Borneo",
            diet: "Parasitic - derives nutrients from Tetrastigma vines",
            funFact: "The flower can grow up to 1 meter in diameter and weigh up to 11 kg!",
            animalSound: "N/A - This is a plant, but it attracts flies with its rotting flesh smell",
            image: "https://pokokkelapa.wordpress.com/wp-content/uploads/2024/02/pokok-kelapa-rafflesia-29.jpg?w=400&h=400&fit=crop"
        },
        {
            id: 18,
            name: "Pitcher Plant",
            designation: "Carnivorous Plant",
            content: "They are carnivorous plants that trap and digest insects in their specialized leaf structures filled with digestive fluids.",
            species: "Nepenthes rajah",
            scientificName: "Nepenthes rajah",
            endangerStatus: "Endangered",
            groupName: "Nepenthaceae",
            habitat: "Highland rainforests of Borneo",
            diet: "Carnivorous - insects, and occasionally small vertebrates",
            funFact: "Some pitcher plants are large enough to trap and digest small mammals like rats!",
            animalSound: "N/A - This is a plant, but you might hear trapped insects buzzing",
            image: "https://www.mysabah.com/wordpress/wp-content/uploads/2009/08/526.jpg?w=400&h=400&fit=crop"
        },
        {
            id: 19,
            name: "Firefly",
            designation: "Lightning Bug",
            content: "They produce light through a chemical reaction called bioluminescence, creating magical displays in mangrove forests.",
            species: "Pteroptyx tener",
            scientificName: "Pteroptyx tener",
            endangerStatus: "Vulnerable",
            groupName: "Lampyridae",
            habitat: "Mangrove forests and riverbanks in Southeast Asia",
            diet: "Larvae are carnivorous - snails, worms; Adults may not feed or eat nectar",
            funFact: "Fireflies synchronize their flashing patterns in some locations, creating spectacular light shows!",
            animalSound: "Generally silent, but may produce soft clicking sounds",
            image: "https://www.kuala-selangor.com/images/firefly-kuala-selangor.jpg?w=400&h=400&fit=crop"
        },
        {
            id: 20,
            name: "Dugong",
            designation: "Sea Cow",
            content: "They are marine mammals closely related to manatees and are the only strictly marine herbivorous mammals.",
            species: "Dugong dugon",
            scientificName: "Dugong dugon",
            endangerStatus: "Vulnerable",
            groupName: "Dugongidae",
            habitat: "Coastal waters, bays, and mangrove channels in tropical regions",
            diet: "Herbivorous - exclusively sea grasses",
            funFact: "Dugongs are thought to be the inspiration for mermaid legends seen by ancient sailors!",
            animalSound: "Chirps, whistles, and barks used for communication underwater",
            image: "https://i0.wp.com/suara.tv/wp-content/uploads/2025/05/11c196a8-d576-40f5-a1ec-12fa51dd0996-1.jpg?w=400&h=400&fit=crop"
        }
    ];

    // Function to randomly select 8 cards
    const getRandomCards = () => {
        const shuffled = [...allEducationalCards].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 8);
    };

    // Initialize with random cards when component mounts
    useEffect(() => {
        setDisplayedCards(getRandomCards());
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-md mx-auto min-h-screen pb-20">
                  <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                        <BreadcrumbLink href="/home">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                        <BreadcrumbLink href="/learn">Learn</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                        <BreadcrumbPage>Flash Cards</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Header */}
                <div className="px-6">
                    <div className="flex items-center justify-end">
                        {/* Card Counter */}
                        <div className="flex items-center gap-2 bg-emerald-100 px-3 py-1 rounded-full">
                            <span className="text-emerald-700 font-semibold text-sm">
                                {currentCard + 1}/{displayedCards.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Swipeable Card Stack */}
                <div className="px-6 mt-8 mb-24">
                    {displayedCards.length > 0 ? (
                        <CardStack
                            items={displayedCards}
                            offset={15}
                            scaleFactor={0.06}
                            onCardChange={setCurrentCard}
                        />
                    ) : (
                        <div className="flex justify-center items-center h-64">
                            <p className="text-gray-500">Loading cards...</p>
                        </div>
                    )}
                </div>

                {/* Pagination Dots */}
                <div className="px-6 flex justify-center gap-2">
                    {displayedCards.map((_, index) => (
                        <div
                            key={index}
                            className={`h-2 rounded-full transition-all duration-300 ${index === currentCard
                                    ? 'w-8 bg-emerald-600'
                                    : 'w-2 bg-gray-300'
                                }`}
                        />
                    ))}
                </div>

                {/* Instructions */}
                <div className="px-6 mt-8">
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
                        <h3 className="font-semibold text-emerald-900 mb-2">How to use:</h3>
                        <ul className="text-sm text-emerald-800 space-y-1">
                            <li>• Test your ability to identify discovered species</li>
                            <li>• Swipe to move on to the next card</li>
                            <li>• Tap a card to learn more about the species</li>
                            <li>• Cards are randomly selected each visit</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}