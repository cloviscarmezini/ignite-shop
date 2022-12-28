import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import axios from 'axios';
import Image from 'next/future/image';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Stripe from 'stripe';
import { stripe } from '../../lib/stripe';
import { ImageContainer, ProductContainer, ProductDetails } from '../../styles/pages/product';
import Head from 'next/head';

interface ProductProps {
    product: {
        id: string;
        name: string;
        imageUrl: string;
        price: string;
        description: string;
        defaultPriceId: string;
    }
}

const Product: NextPage = ({ product }: ProductProps) => {
    const { isFallback } = useRouter();
    const [isCreatingCheckoutSession, setIsCreatingCheckoutSession] = useState(false);

    if(isFallback) {
        return <p>Loading</p>
    }

    async function handleBuyProduct() {
        try {
            setIsCreatingCheckoutSession(true);

            const response = await axios.post('/api/checkout', {
                priceId: product.defaultPriceId
            });

            const { checkoutUrl } = response.data;

            window.location.href = checkoutUrl;
        } catch(error) {
            setIsCreatingCheckoutSession(false);
            alert('Falha ao redirecionar ao checkout')
        }
    }

    return (
        <>
            <Head>
                <title>{product.name} - Ignite Shop</title>
            </Head>
            <ProductContainer>
                <ImageContainer>
                    <Image
                        src={product.imageUrl}
                        height={480}
                        width={520}
                        alt=""
                    />
                </ImageContainer>

                <ProductDetails>
                    <h1>{product.name}</h1>
                    <span>{product.price}</span>

                    <p>{product.description}</p>

                    <button
                        disabled={isCreatingCheckoutSession}
                        onClick={handleBuyProduct}
                    >
                        Comprar agora
                    </button>
                </ProductDetails>
            </ProductContainer>
        </>
    )
}

export default Product

export const getStaticPaths: GetStaticPaths = async () => {
    return {
        paths: [
            { params: { id: "prod_MVUyjWLyz5aWd7" } }
        ],
        fallback: true
    }
}

export const getStaticProps: GetStaticProps<any, { id: string }> = async ({ params }) => {
    const productId = params.id;

    const product = await stripe.products.retrieve(productId, {
        expand: ['default_price']
    })

    const price = product.default_price as Stripe.Price;

    return {
        props: {
            product: {
                id: product.id,
                name: product.name,
                imageUrl: product.images[0],
                price: new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(price.unit_amount / 100),
                description: product.description,
                defaultPriceId: price.id
            }
        },
        revalidate: 60 * 60 * 1, // 1 hora
    }
}