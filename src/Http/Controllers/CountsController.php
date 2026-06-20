<?php

namespace Eyepiece\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class CountsController extends Controller
{
    public function index()
    {
        $counts = $this->connection()
            ->table('telescope_entries')
            ->select('type', DB::raw('count(*) as total'))
            ->groupBy('type')
            ->pluck('total', 'type');

        return response()->json([
            'counts' => $counts,
        ]);
    }

    public function batchQueryCounts(Request $request)
    {
        $batchIds = array_filter((array) $request->input('batch_ids', []));

        if (empty($batchIds)) {
            return response()->json(['counts' => (object) []]);
        }

        $counts = $this->connection()
            ->table('telescope_entries')
            ->where('type', 'query')
            ->whereIn('batch_id', $batchIds)
            ->select('batch_id', DB::raw('count(*) as total'))
            ->groupBy('batch_id')
            ->pluck('total', 'batch_id');

        return response()->json([
            'counts' => $counts,
        ]);
    }

    protected function connection()
    {
        return DB::connection(
            config('telescope.storage.database.connection')
        );
    }
}
