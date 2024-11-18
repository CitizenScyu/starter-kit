import { Container } from '../../components/container';
import { Layout } from '../../components/layout';
import { PersonalHeader } from '../../components/personal-theme-header';
import { Footer } from '../../components/footer';
import { AppProvider } from '../../components/contexts/appContext';
import { PublicationFragment, SeriesFragment } from '../../generated/graphql';
import { GetStaticProps, GetStaticPaths } from 'next';
import request from 'graphql-request';
import { SingleSeriesByPublicationDocument, SeriesByPublicationDocument } from '../../generated/graphql';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

type Props = {
  publication: PublicationFragment;
  series: SeriesFragment;
};

export default function SeriesDetail({ publication, series }: Props) {
  return (
    <AppProvider publication={publication}>
      <Layout>
        <Head>
          <title>{series.name} - {publication.title}</title>
          <meta
            name="description"
            content={series.description?.text || `${series.name} series from ${publication.title}`}
          />
        </Head>
        <Container className="mx-auto flex max-w-3xl flex-col items-stretch gap-10 px-5 py-10">
          <PersonalHeader />
          <main>
            <header className="mb-10">
              {series.coverImage && (
                <div className="relative -mx-5 mb-6 h-64 overflow-hidden sm:-mx-5 md:h-96">
                  <Image
                    src={series.coverImage}
                    alt={series.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
                {series.name}
              </h1>
              {series.description?.text && (
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  {series.description.text}
                </p>
              )}
              <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                {series.posts.totalDocuments} {series.posts.totalDocuments === 1 ? 'post' : 'posts'} in series
              </div>
            </header>
            <div className="space-y-6">
              {series.posts.edges.map(({ node: post }, index) => (
                <article
                  key={post.slug}
                  className="relative flex flex-col space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                >
                  <div className="absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {index + 1}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    <Link href={`/${post.slug}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">{post.brief}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
                    <time dateTime={post.publishedAt}>
                      {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                    </time>
                    <span>{post.readTimeInMinutes} min read</span>
                  </div>
                </article>
              ))}
            </div>
          </main>
          <Footer />
        </Container>
      </Layout>
    </AppProvider>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const data = await request(
    process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT,
    SeriesByPublicationDocument,
    {
      host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST,
    }
  );

  const paths = data.publication?.seriesList?.edges.map(({ node }) => ({
    params: { slug: node.slug },
  })) || [];

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;

  const data = await request(
    process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT,
    SingleSeriesByPublicationDocument,
    {
      host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST,
      slug,
    }
  );

  if (!data.publication || !data.publication.series) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      publication: data.publication,
      series: data.publication.series,
    },
    revalidate: 60,
  };
};
